import csv
import io

from fastapi import APIRouter, UploadFile, File, HTTPException, Response

from incident_core import parse_csv_rows, separate_valid_invalid, compute_metrics

router = APIRouter()

# In-memory storage of the most recent analysis result, so the export
# endpoint can return it without the client re-uploading the file.
_last_analysis = None


@router.post("/analyze")
async def analyze_incidents(file: UploadFile = File(...)):
    """Receive a CSV file, validate and analyze it, and return a JSON summary."""
    global _last_analysis

    raw_bytes = await file.read()

    try:
        text = raw_bytes.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File must be UTF-8 encoded text.")

    try:
        rows = parse_csv_rows(io.StringIO(text))
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))

    valid_rows, invalid_reason_counts = separate_valid_invalid(rows)
    metrics = compute_metrics(valid_rows)

    summary = {
        "total_records": len(rows),
        "valid_records": len(valid_rows),
        "invalid_records": sum(invalid_reason_counts.values()),
        "invalid_by_reason": dict(invalid_reason_counts),
        "category_breakdown": dict(metrics["category_counts"]),
        "status_breakdown": dict(metrics["status_counts"]),
        "satisfaction": {
            "scored_closed_count": metrics["scored_closed_count"],
            "average_score": (
                round(metrics["average_satisfaction"], 2)
                if metrics["average_satisfaction"] is not None
                else None
            ),
            "distribution": dict(metrics["score_distribution"]),
        },
    }

    _last_analysis = summary
    return summary


@router.get("/results/export")
def export_last_analysis():
    """Return the most recent analysis result as a downloadable CSV."""
    if _last_analysis is None:
        raise HTTPException(
            status_code=404,
            detail="No analysis has been run yet. Call POST /analyze first.",
        )

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=["metric", "value", "percentage"])
    writer.writeheader()

    data = _last_analysis
    total = data["total_records"]

    writer.writerow({"metric": "total_records", "value": total, "percentage": ""})
    writer.writerow({
        "metric": "valid_records",
        "value": data["valid_records"],
        "percentage": f"{(data['valid_records'] / total * 100):.1f}%",
    })
    writer.writerow({
        "metric": "invalid_records",
        "value": data["invalid_records"],
        "percentage": f"{(data['invalid_records'] / total * 100):.1f}%",
    })

    for reason, count in sorted(data["invalid_by_reason"].items()):
        writer.writerow({
            "metric": f"invalid_reason_{reason}",
            "value": count,
            "percentage": f"{(count / total * 100):.1f}%",
        })

    for category, count in sorted(data["category_breakdown"].items()):
        writer.writerow({"metric": f"category_{category}", "value": count, "percentage": ""})

    for status, count in sorted(data["status_breakdown"].items()):
        writer.writerow({"metric": f"status_{status}", "value": count, "percentage": ""})

    satisfaction = data["satisfaction"]
    writer.writerow({
        "metric": "scored_closed_count",
        "value": satisfaction["scored_closed_count"],
        "percentage": "",
    })
    writer.writerow({
        "metric": "average_satisfaction",
        "value": satisfaction["average_score"] if satisfaction["average_score"] is not None else "N/A",
        "percentage": "",
    })

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=results.csv"},
    )
