import cv2
import json
import math

from backend.config import CLEAN_ACTION_EVENTS_JSON

ACTION_EVENTS_JSON = CLEAN_ACTION_EVENTS_JSON

PASS_LOOKBACK_FRAMES = 25
PASS_LOOKAHEAD_FRAMES = 3

DRIVE_LOOKBACK_FRAMES = 5
DRIVE_LOOKAHEAD_FRAMES = 5

ACTION_MAX_PIXEL_DISTANCE = 90


def team_name_from_id(team_id):
    if team_id == 0:
        return "red"
    if team_id == 1:
        return "cyan"
    return "unknown"


def load_clean_action_events(json_path=ACTION_EVENTS_JSON):
    import os
    if not os.path.exists(json_path):
        print(f"Warning: {json_path} not found. Returning empty action events.")
        return []
    
    with open(json_path, "r") as f:
        data = json.load(f)

    return sorted(data["events"], key=lambda x: x["time_sec"])


def build_action_frame_map(action_events, fps):
    action_frame_map = {}

    for e in action_events:
        event_frame = int(round(float(e["time_sec"]) * fps))
        label = e["label"]

        if label == "PASS":
            start = event_frame - PASS_LOOKAHEAD_FRAMES
            end = event_frame + PASS_LOOKAHEAD_FRAMES
        elif label == "DRIVE":
            start = event_frame - DRIVE_LOOKAHEAD_FRAMES
            end = event_frame + DRIVE_LOOKAHEAD_FRAMES
        else:
            continue

        for f in range(start, end + 1):
            action_frame_map.setdefault(f, []).append({
                "event_id": int(e["event_id"]),
                "label": label,
                "event_time_sec": float(e["time_sec"]),
                "event_frame": event_frame,
                "confidence": float(e["confidence"]),
                "gameTime": e.get("gameTime", "")
            })

    return action_frame_map


def dist_px(a, b):
    return math.sqrt(
        (float(a[0]) - float(b[0])) ** 2 +
        (float(a[1]) - float(b[1])) ** 2
    )


def find_player_from_window(event_frame, action_label, contact_buffer):
    candidates = []

    if action_label == "PASS":
        lookback = PASS_LOOKBACK_FRAMES
        lookahead = PASS_LOOKAHEAD_FRAMES
        method = "pass_image_contact_window"
    else:
        lookback = DRIVE_LOOKBACK_FRAMES
        lookahead = DRIVE_LOOKAHEAD_FRAMES
        method = "drive_image_contact_window"

    for item in contact_buffer:
        f = item["frame_idx"]

        if f < event_frame - lookback:
            continue

        if f > event_frame + lookahead:
            continue

        ball_img = item["ball_img"]
        players_img = item["players_img"]

        if ball_img is None or len(players_img) == 0:
            continue

        best_player = None
        best_dist = 999999

        for p in players_img:
            d = dist_px(ball_img, p["foot_img"])

            if d < best_dist:
                best_dist = d
                best_player = p

        if best_player is not None and best_dist <= ACTION_MAX_PIXEL_DISTANCE:
            candidates.append({
                "frame_idx": f,
                "team": best_player["team"],
                "display_id": best_player["display_id"],
                "role": best_player.get("role", "player"),
                "count_stats": best_player.get("count_stats", True),
                "distance_px": best_dist,
                "time_offset_frames": event_frame - f,
                "field_pos": best_player.get("field_pos")
            })

    if len(candidates) == 0:
        return None

    candidates = sorted(
        candidates,
        key=lambda x: (
            abs(x["time_offset_frames"]),
            x["distance_px"]
        )
    )

    best = candidates[0]

    return {
        "team": best["team"],
        "display_id": int(best["display_id"]) if str(best["display_id"]) != "GK" else "GK",
        "role": best.get("role", "player"),
        "count_stats": best.get("count_stats", True),
        "method": method,
        "distance_px": round(float(best["distance_px"]), 2),
        "contact_frame": int(best["frame_idx"]),
        "event_frame": int(event_frame),
        "time_offset_frames": int(best["time_offset_frames"]),
        "votes": len(candidates),
        "field_pos": best.get("field_pos")
    }


def draw_action_event(frame, active, labels=None, x=35, y=60):
    if not active:
        return

    if labels is None:
        labels = []

    text = " | ".join(labels) if len(labels) > 0 else "ACTION"

    cv2.rectangle(
        frame,
        (x - 20, y - 45),
        (x + 430, y + 20),
        (0, 0, 0),
        -1
    )

    cv2.putText(
        frame,
        text,
        (x, y),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.9,
        (0, 255, 0),
        3,
        cv2.LINE_AA
    )