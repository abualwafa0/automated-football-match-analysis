import json
import numpy as np

from backend.config import MATCH_STATS_JSON

MIN_STEP_M = 0.03


def init_player_stats(roster):
    for p in roster:
        p.total_distance_m = 0.0
        p.last_field_pos = None
        p.heatmap_points = []


def update_distance(player, field_pos):
    if field_pos is None:
        return

    field_pos = np.array(field_pos, dtype=np.float32)

    if player.last_field_pos is None:
        player.last_field_pos = field_pos
        return

    step_m = float(
        np.linalg.norm(field_pos - player.last_field_pos)
    )

    if step_m >= MIN_STEP_M:
        player.total_distance_m += step_m

    player.last_field_pos = field_pos


def save_stats(roster, output_path=MATCH_STATS_JSON):
    stats = {
        "red": {
            "total_distance_m": 0,
            "players": []
        },
        "cyan": {
            "total_distance_m": 0,
            "players": []
        }
    }

    for p in roster:
        team = "red" if p.team_id == 0 else "cyan"

        item = {
            "id": p.display_id,
            "distance_m": round(p.total_distance_m, 2)
        }

        stats[team]["players"].append(item)
        stats[team]["total_distance_m"] += p.total_distance_m

    for team in ["red", "cyan"]:
        stats[team]["total_distance_m"] = round(
            stats[team]["total_distance_m"],
            2
        )

        stats[team]["distance_ranking"] = sorted(
            stats[team]["players"],
            key=lambda x: x["distance_m"],
            reverse=True
        )

    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, "w") as f:
        json.dump(stats, f, indent=2)

    return stats