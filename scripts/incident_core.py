import csv
from collections import Counter


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


def parse_csv_rows(file_object):
    """Parse incident rows from an already-open, text-mode file-like object.

    Works both with a real file (from open()) and with an in-memory
    text stream (e.g. io.StringIO), which is what the API will use
    when reading an uploaded file.

    Raises ValueError if there are no data rows.
    """
    reader = csv.DictReader(file_object)
    rows = list(reader)

    if not rows:
        raise ValueError("The CSV file contains no data rows.")

    return rows


def validate_incident(row):
    """Validate a single incident record against the HealthCore context rules.

    Returns a tuple (is_valid, reason). If valid, reason is None.
    Only the FIRST violation found is reported, checked in a fixed order.
    """
    for field in REQUIRED_FIELDS:
        if not row.get(field, "").strip():
            return False, "missing_field"

    if row["category"] not in VALID_CATEGORIES:
        return False, "invalid_category"

    if row["status"] not in VALID_STATUSES:
        return False, "invalid_status"

    if len(row["description"].strip()) < MIN_DESCRIPTION_LENGTH:
        return False, "description_too_short"

    score_raw = row.get("satisfaction_score", "").strip()

    if row["status"] == "closed":
        if not score_raw:
            return False, "closed_missing_score"
        if not _is_valid_score(score_raw):
            return False, "score_out_of_range"
    elif score_raw and not _is_valid_score(score_raw):
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

    Returns a tuple (valid_rows, invalid_reason_counts).
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
    """Compute all reportable metrics from the list of valid incident rows."""
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