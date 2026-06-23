import json

from backend.config import BALL_ACTION_EVENTS_JSON, CLEAN_ACTION_EVENTS_JSON

DRIVE_MIN_CONFIDENCE = 0.23
PASS_DRIVE_MERGE_WINDOW_SEC = 0.5


def clean_action_events(
    input_json=BALL_ACTION_EVENTS_JSON,
    output_json=CLEAN_ACTION_EVENTS_JSON
):
    with open(input_json, "r") as f:
        data = json.load(f)

    raw_events = data["events"]

    passes = [e for e in raw_events if e["label"] == "PASS"]

    drives = [
        e for e in raw_events
        if e["label"] == "DRIVE"
        and float(e["confidence"]) >= DRIVE_MIN_CONFIDENCE
    ]

    clean_passes = []

    for p in passes:
        p_time = float(p["time_sec"])

        near_drive = any(
            abs(p_time - float(d["time_sec"])) <= PASS_DRIVE_MERGE_WINDOW_SEC
            for d in drives
        )

        if not near_drive:
            clean_passes.append(p)

    merged_events = []

    for e in clean_passes:
        merged_events.append({
            "event_id": None,
            "label": "PASS",
            "time_sec": float(e["time_sec"]),
            "frame_idx_25fps": int(e["frame_idx_25fps"]),
            "confidence": float(e["confidence"]),
            "gameTime": e.get("gameTime", "")
        })

    for e in drives:
        merged_events.append({
            "event_id": None,
            "label": "DRIVE",
            "time_sec": float(e["time_sec"]),
            "frame_idx_25fps": int(e["frame_idx_25fps"]),
            "confidence": float(e["confidence"]),
            "gameTime": e.get("gameTime", "")
        })

    merged_events = sorted(merged_events, key=lambda x: x["time_sec"])

    for i, e in enumerate(merged_events, start=1):
        e["event_id"] = i

    out = {
        "source": "ball_action_cleaned",
        "drive_min_confidence": DRIVE_MIN_CONFIDENCE,
        "pass_drive_merge_window_sec": PASS_DRIVE_MERGE_WINDOW_SEC,
        "num_events": len(merged_events),
        "num_passes": sum(e["label"] == "PASS" for e in merged_events),
        "num_drives": sum(e["label"] == "DRIVE" for e in merged_events),
        "events": merged_events
    }

    output_json.parent.mkdir(parents=True, exist_ok=True)

    with open(output_json, "w") as f:
        json.dump(out, f, indent=2)

    return out