import json

from backend.config import (
    MATCH_STATS_JSON,
    EVENT_STATS_WEB_JSON,
    POSSESSION_WEB_JSON,
    FINAL_ANALYTICS_JSON,
    FINAL_VIDEO_PATH,
    PROJECTION_VIDEO_PATH,
    HEATMAPS_OUTPUT_DIR,
)


def load_json(path):
    with open(path, "r") as f:
        return json.load(f)


def merge_final_analytics(
    match_stats_json=MATCH_STATS_JSON,
    event_stats_json=EVENT_STATS_WEB_JSON,
    possession_json=POSSESSION_WEB_JSON,
    output_json=FINAL_ANALYTICS_JSON
):
    match_stats = load_json(match_stats_json)
    event_stats = load_json(event_stats_json)
    possession = load_json(possession_json)

    final_data = {
        "metadata": {
            "source": "football_analytics_backend",
            "version": "1.0"
        },

        "summary": {
            "distance": {
                "red_total_distance_m": match_stats["red"]["total_distance_m"],
                "cyan_total_distance_m": match_stats["cyan"]["total_distance_m"]
            },
            "events": event_stats["summary"],
            "possession": possession["teams"]
        },

        "teams": {
            "red": {
                "distance": match_stats["red"],
                "passes": event_stats["teams"].get("red", {}).get("passes", {}),
                "drives": event_stats["teams"].get("red", {}).get("drives", {}),
                "recoveries": event_stats["teams"].get("red", {}).get("recoveries", 0),
                "possession": possession["teams"].get("red", {})
            },
            "cyan": {
                "distance": match_stats["cyan"],
                "passes": event_stats["teams"].get("cyan", {}).get("passes", {}),
                "drives": event_stats["teams"].get("cyan", {}).get("drives", {}),
                "recoveries": event_stats["teams"].get("cyan", {}).get("recoveries", 0),
                "possession": possession["teams"].get("cyan", {})
            }
        },

        "players": event_stats["players"],

        "rankings": {
            "red_distance": match_stats["red"].get("distance_ranking", []),
            "cyan_distance": match_stats["cyan"].get("distance_ranking", []),
            "pass_accuracy": event_stats["rankings"].get("pass_accuracy", []),
            "drive_success": event_stats["rankings"].get("drive_success", [])
        },

        "events": event_stats["events"],

        "files": {
            "analysis_video": str(FINAL_VIDEO_PATH),
            "projection_video": str(PROJECTION_VIDEO_PATH),
            "heatmaps": {
                "red_team": str(HEATMAPS_OUTPUT_DIR / "team_red_heatmap.png"),
                "cyan_team": str(HEATMAPS_OUTPUT_DIR / "team_cyan_heatmap.png"),
                "folder": str(HEATMAPS_OUTPUT_DIR)
            }
        }
    }

    output_json.parent.mkdir(parents=True, exist_ok=True)

    with open(output_json, "w") as f:
        json.dump(final_data, f, indent=2)

    print("Final analytics saved:", output_json)

    return final_data


if __name__ == "__main__":
    merge_final_analytics()