import argparse
import csv
import sys

from incident_core import parse_csv_rows, separate_valid_invalid, compute_metrics


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
    """Open the CSV file from disk and parse it into a list of dicts.

    Exits the program with a clear error message if the file cannot be read.
    """
    try:
        with open(csv_path, newline="", encoding="utf-8") as csv_file:
            rows = parse_csv_rows(csv_file)
    except FileNotFoundError:
        print(f"Error: file not found: {csv_path}", file=sys.stderr)
        sys.exit(1)
    except OSError as error:
        print(f"Error: could not read file '{csv_path}': {error}", file=sys.stderr)
        sys.exit(1)
    except ValueError as error:
        print(f"Error: {error}", file=sys.stderr)
        sys.exit(1)

    return rows


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