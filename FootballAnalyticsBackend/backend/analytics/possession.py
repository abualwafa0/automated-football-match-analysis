import json

from backend.config import EVENT_STATS_WEB_JSON, POSSESSION_WEB_JSON

MAX_ACTIVE_GAP_SEC = 8.0


def compute_possession(
    input_json=EVENT_STATS_WEB_JSON,
    output_json=POSSESSION_WEB_JSON
):
    with open(input_json, "r") as f:
        data = json.load(f)

    events = sorted(
        [e for e in data["events"] if e.get("team") is not None],
        key=lambda x: x["time_sec"]
    )

    possession_seconds = {
        "red": 0.0,
        "cyan": 0.0
    }

    inactive_seconds = 0.0

    for i in range(len(events) - 1):
        current = events[i]
        next_event = events[i + 1]

        team = current["team"]
        gap = float(next_event["time_sec"]) - float(current["time_sec"])

        if gap <= 0:
            continue

        active_time = min(gap, MAX_ACTIVE_GAP_SEC)
        inactive_time = max(0.0, gap - MAX_ACTIVE_GAP_SEC)

        if team in possession_seconds:
            possession_seconds[team] += active_time

        inactive_seconds += inactive_time

    active_total = sum(possession_seconds.values())

    possession_percent = {}

    for team, sec in possession_seconds.items():
        if active_total > 0:
            possession_percent[team] = round(sec / active_total * 100, 2)
        else:
            possession_percent[team] = 0.0

    out = {
        "method": "estimated_possession_from_pass_and_drive_events",
        "max_active_gap_sec": MAX_ACTIVE_GAP_SEC,
        "active_seconds": round(active_total, 2),
        "inactive_seconds": round(inactive_seconds, 2),
        "teams": {
            team: {
                "seconds": round(possession_seconds[team], 2),
                "percent": possession_percent[team]
            }
            for team in possession_seconds
        }
    }

    output_json.parent.mkdir(parents=True, exist_ok=True)

    with open(output_json, "w") as f:
        json.dump(out, f, indent=2)

    return out