import argparse
import csv
import sys
from collections import Counter


def parse_arguments():
    """Parse the CSV file path from the command line.

    Usage: python analyze.py <csv_path>
    """
    parser = argparse.ArgumentParser(
        description="Analyze a company incident CSV file and report metrics."
    )
    parser.add_argument(
        "csv_path",
        help="Path to the incidents CSV file (e.g. incidents-healthcore.csv)",
    )
    args = parser.parse_args()
    return args.csv_path


def load_incidents(csv_path):
    """Load incident records from a CSV file.

    Returns a list of dicts, one per row, with the original string values.
    Exits the program with a clear error message if the file cannot be read.
    """
    try:
        with open(csv_path, newline="", encoding="utf-8") as csv_file:
            reader = csv.DictReader(csv_file)
            rows = list(reader)
    except FileNotFoundError:
        print(f"Error: file not found: {csv_path}", file=sys.stderr)
        sys.exit(1)
    except OSError as error:
        print(f"Error: could not read file '{csv_path}': {error}", file=sys.stderr)
        sys.exit(1)

    if not rows:
        print(f"Error: '{csv_path}' contains no data rows.", file=sys.stderr)
        sys.exit(1)

    return rows


VALID_CATEGORIES = {
    "billing",
    "appointment_scheduling",
    "clinical_communication",
    "records_access",
    "facility",
    "other",
}

VALID_STATUSES = {"open", "closed", "discarded"}

REQUIRED_FIELDS = ["incident_id", "clinic", "category", "status", "description", "reported_at"]

MIN_DESCRIPTION_LENGTH = 10


def validate_incident(row):
    """Validate a single incident record against the HealthCore context rules.

    Returns a tuple (is_valid, reason). If valid, reason is None.
    Only the FIRST violation found is reported, checked in a fixed order.
    """
    # Rule 1: required fields must not be missing or empty
    for field in REQUIRED_FIELDS:
        if not row.get(field, "").strip():
            return False, "missing_field"

    # Rule 2: category must be one of the allowed values
    if row["category"] not in VALID_CATEGORIES:
        return False, "invalid_category"

    # Rule 3: status must be one of the allowed values
    if row["status"] not in VALID_STATUSES:
        return False, "invalid_status"

    # Rule 4: description must meet the minimum length
    if len(row["description"].strip()) < MIN_DESCRIPTION_LENGTH:
        return False, "description_too_short"

    # Rule 5: satisfaction_score rules depend on status
    score_raw = row.get("satisfaction_score", "").strip()

    if row["status"] == "closed":
        if not score_raw:
            return False, "closed_missing_score"
        if not _is_valid_score(score_raw):
            return False, "score_out_of_range"
    elif score_raw and not _is_valid_score(score_raw):
        # score is optional for open/discarded, but if present, must be valid
        return False, "score_out_of_range"

    return True, None


def _is_valid_score(score_raw):
    """Check whether a raw string score is an integer between 1 and 5."""
    try:
        score = int(score_raw)
    except ValueError:
        return False
    return 1 <= score <= 5


def separate_valid_invalid(rows):
    """Apply validate_incident to every row and split them into two groups.

    Returns a tuple (valid_rows, invalid_reason_counts) where:
    - valid_rows is a list of the dicts that passed validation
    - invalid_reason_counts is a Counter mapping reason -> how many rows failed for it
    """
    valid_rows = []
    invalid_reason_counts = Counter()

    for row in rows:
        is_valid, reason = validate_incident(row)
        if is_valid:
            valid_rows.append(row)
        else:
            invalid_reason_counts[reason] += 1

    return valid_rows, invalid_reason_counts


def compute_metrics(valid_rows):
    """Compute all reportable metrics from the list of valid incident rows.

    Returns a dict with:
    - category_counts: Counter of category -> count
    - status_counts: Counter of status -> count
    - scored_closed_count: how many closed incidents have a valid score
    - average_satisfaction: average of those scores (float), or None if none exist
    - score_distribution: Counter of score value -> how many times it appears
    """
    category_counts = Counter(row["category"] for row in valid_rows)
    status_counts = Counter(row["status"] for row in valid_rows)

    closed_scores = []
    for row in valid_rows:
        if row["status"] == "closed":
            score_raw = row.get("satisfaction_score", "").strip()
            if score_raw:
                closed_scores.append(int(score_raw))

    if closed_scores:
        average_satisfaction = sum(closed_scores) / len(closed_scores)
    else:
        average_satisfaction = None

    score_distribution = Counter(closed_scores)

    return {
        "category_counts": category_counts,
        "status_counts": status_counts,
        "scored_closed_count": len(closed_scores),
        "average_satisfaction": average_satisfaction,
        "score_distribution": score_distribution,
    }


def print_report(csv_path, total_records, valid_rows, invalid_reason_counts, metrics):
    """Print a formatted, human-readable report to the console."""
    invalid_total = sum(invalid_reason_counts.values())

    print("=" * 60)
    print(f"INCIDENT ANALYSIS REPORT — {csv_path}")
    print("=" * 60)

    print("\n-- Totals --")
    print(f"{'Total records:':<30}{total_records}")
    print(f"{'Valid records:':<30}{len(valid_rows)}")
    print(f"{'Invalid records:':<30}{invalid_total}")

    print("\n-- Invalid records by reason --")
    if invalid_reason_counts:
        for reason, count in sorted(invalid_reason_counts.items()):
            print(f"{reason:<30}{count}")
    else:
        print("No invalid records found.")

    print("\n-- Breakdown by category (valid only) --")
    for category, count in sorted(metrics["category_counts"].items()):
        print(f"{category:<30}{count}")

    print("\n-- Breakdown by status (valid only) --")
    for status, count in sorted(metrics["status_counts"].items()):
        print(f"{status:<30}{count}")

    print("\n-- Satisfaction metrics (closed incidents with score) --")
    print(f"{'Scored closed incidents:':<30}{metrics['scored_closed_count']}")
    if metrics["average_satisfaction"] is not None:
        print(f"{'Average satisfaction score:':<30}{metrics['average_satisfaction']:.2f}")
        print("Score distribution:")
        for score in sorted(metrics["score_distribution"]):
            count = metrics["score_distribution"][score]
            print(f"  {score}: {count}")
    else:
        print(f"{'Average satisfaction score:':<30}N/A")

    print("=" * 60)


def export_to_csv(total_records, valid_rows, invalid_reason_counts, metrics):
    """Prompt the user and, if confirmed, write results.csv with one row per metric."""
    answer = input("Export results to CSV? [y / n]: ").strip().lower()

    if answer != "y":
        print("Export skipped.")
        return

    invalid_total = sum(invalid_reason_counts.values())
    valid_total = len(valid_rows)

    rows_to_write = []

    rows_to_write.append({"metric": "total_records", "value": total_records, "percentage": ""})
    rows_to_write.append({
        "metric": "valid_records",
        "value": valid_total,
        "percentage": f"{(valid_total / total_records * 100):.1f}%",
    })
    rows_to_write.append({
        "metric": "invalid_records",
        "value": invalid_total,
        "percentage": f"{(invalid_total / total_records * 100):.1f}%",
    })

    for reason, count in sorted(invalid_reason_counts.items()):
        rows_to_write.append({
            "metric": f"invalid_reason_{reason}",
            "value": count,
            "percentage": f"{(count / total_records * 100):.1f}%",
        })

    for category, count in sorted(metrics["category_counts"].items()):
        rows_to_write.append({"metric": f"category_{category}", "value": count, "percentage": ""})

    for status, count in sorted(metrics["status_counts"].items()):
        rows_to_write.append({"metric": f"status_{status}", "value": count, "percentage": ""})

    rows_to_write.append({
        "metric": "scored_closed_count",
        "value": metrics["scored_closed_count"],
        "percentage": "",
    })

    average = metrics["average_satisfaction"]
    rows_to_write.append({
        "metric": "average_satisfaction",
        "value": f"{average:.2f}" if average is not None else "N/A",
        "percentage": "",
    })

    with open("results.csv", "w", newline="", encoding="utf-8") as csv_file:
        writer = csv.DictWriter(csv_file, fieldnames=["metric", "value", "percentage"])
        writer.writeheader()
        writer.writerows(rows_to_write)

    print("Results exported to results.csv")


def main():
    csv_path = parse_arguments()
    rows = load_incidents(csv_path)
    valid_rows, invalid_reason_counts = separate_valid_invalid(rows)
    metrics = compute_metrics(valid_rows)

    print_report(csv_path, len(rows), valid_rows, invalid_reason_counts, metrics)
    export_to_csv(len(rows), valid_rows, invalid_reason_counts, metrics)


if __name__ == "__main__":
    main()