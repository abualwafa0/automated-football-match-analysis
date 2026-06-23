import json
from collections import defaultdict

from backend.config import ACTION_EVENTS_WITH_PLAYERS_JSON, EVENT_STATS_WEB_JSON


def compute_event_stats(
    input_json=ACTION_EVENTS_WITH_PLAYERS_JSON,
    output_json=EVENT_STATS_WEB_JSON
):
    with open(input_json, "r") as f:
        data = json.load(f)

    events = sorted(data["events"], key=lambda x: x["time_sec"])

    valid_events = [
        e for e in events
        if e.get("player") is not None
    ]

    def is_gk(player):
        return (
            str(player.get("display_id")) == "GK"
            or player.get("role") == "goalkeeper"
            or player.get("count_stats") is False
        )

    def safe_player_id(player):
        pid = player["display_id"]
        if str(pid) == "GK":
            return "GK"
        return int(pid)

    team_stats = defaultdict(lambda: {
        "passes": {"total": 0, "successful": 0, "failed": 0, "accuracy_percent": 0.0},
        "drives": {"total": 0, "successful": 0, "failed": 0, "success_percent": 0.0},
        "recoveries": 0
    })

    player_stats = defaultdict(lambda: defaultdict(lambda: {
        "passes": {"total": 0, "successful": 0, "failed": 0, "accuracy_percent": 0.0},
        "drives": {"total": 0, "successful": 0, "failed": 0, "success_percent": 0.0},
        "recoveries": 0
    }))

    clean_events = []

    for i, e in enumerate(valid_events):
        player = e["player"]
        team = player["team"]
        player_id = str(player["display_id"])
        label = e["label"]
        count_player_stats = not is_gk(player)

        next_event = valid_events[i + 1] if i + 1 < len(valid_events) else None
        next_player = next_event["player"] if next_event else None

        successful = False
        result = "unknown"

        if next_player is not None:
            same_player = (
                next_player["team"] == team
                and str(next_player["display_id"]) == str(player["display_id"])
            )

            if label == "PASS" and same_player:
                result = "ignored_same_player_pass"

            elif next_player["team"] == team:
                successful = True
                result = "successful"

            else:
                successful = False
                result = "failed"

                recovery_team = next_player["team"]
                team_stats[recovery_team]["recoveries"] += 1

                if not is_gk(next_player):
                    recovery_player_id = str(next_player["display_id"])
                    player_stats[recovery_team][recovery_player_id]["recoveries"] += 1

        if label == "PASS" and result != "ignored_same_player_pass":
            team_stats[team]["passes"]["total"] += 1

            if count_player_stats:
                player_stats[team][player_id]["passes"]["total"] += 1

            if successful:
                team_stats[team]["passes"]["successful"] += 1
                if count_player_stats:
                    player_stats[team][player_id]["passes"]["successful"] += 1
            else:
                team_stats[team]["passes"]["failed"] += 1
                if count_player_stats:
                    player_stats[team][player_id]["passes"]["failed"] += 1

        elif label == "DRIVE":
            team_stats[team]["drives"]["total"] += 1

            if count_player_stats:
                player_stats[team][player_id]["drives"]["total"] += 1

            if successful:
                team_stats[team]["drives"]["successful"] += 1
                if count_player_stats:
                    player_stats[team][player_id]["drives"]["successful"] += 1
            else:
                team_stats[team]["drives"]["failed"] += 1
                if count_player_stats:
                    player_stats[team][player_id]["drives"]["failed"] += 1

        clean_events.append({
            "event_id": e["event_id"],
            "type": label,
            "time_sec": e["time_sec"],
            "team": team,
            "player_id": safe_player_id(player),
            "is_goalkeeper": is_gk(player),
            "next_team": next_player["team"] if next_player else None,
            "next_player_id": safe_player_id(next_player) if next_player else None,
            "next_is_goalkeeper": is_gk(next_player) if next_player else None,
            "successful": successful,
            "result": result
        })

    for team, stats in team_stats.items():
        p = stats["passes"]
        if p["total"] > 0:
            p["accuracy_percent"] = round(p["successful"] / p["total"] * 100, 2)

        d = stats["drives"]
        if d["total"] > 0:
            d["success_percent"] = round(d["successful"] / d["total"] * 100, 2)

    for team, players in player_stats.items():
        for player_id, stats in players.items():
            p = stats["passes"]
            if p["total"] > 0:
                p["accuracy_percent"] = round(p["successful"] / p["total"] * 100, 2)

            d = stats["drives"]
            if d["total"] > 0:
                d["success_percent"] = round(d["successful"] / d["total"] * 100, 2)

    player_pass_accuracy_rank = []

    for team, players in player_stats.items():
        for player_id, stats in players.items():
            if stats["passes"]["total"] > 0:
                player_pass_accuracy_rank.append({
                    "team": team,
                    "player_id": int(player_id),
                    "total_passes": stats["passes"]["total"],
                    "successful_passes": stats["passes"]["successful"],
                    "failed_passes": stats["passes"]["failed"],
                    "accuracy_percent": stats["passes"]["accuracy_percent"]
                })

    player_pass_accuracy_rank = sorted(
        player_pass_accuracy_rank,
        key=lambda x: (x["accuracy_percent"], x["total_passes"]),
        reverse=True
    )

    player_drive_success_rank = []

    for team, players in player_stats.items():
        for player_id, stats in players.items():
            if stats["drives"]["total"] > 0:
                player_drive_success_rank.append({
                    "team": team,
                    "player_id": int(player_id),
                    "total_drives": stats["drives"]["total"],
                    "successful_drives": stats["drives"]["successful"],
                    "failed_drives": stats["drives"]["failed"],
                    "success_percent": stats["drives"]["success_percent"]
                })

    player_drive_success_rank = sorted(
        player_drive_success_rank,
        key=lambda x: (x["success_percent"], x["total_drives"]),
        reverse=True
    )

    out = {
        "summary": {
            "total_events": len(events),
            "valid_events": len(valid_events),
            "ignored_events": len(events) - len(valid_events),
            "ignored_same_player_passes": sum(
                e["result"] == "ignored_same_player_pass"
                for e in clean_events
            ),
            "total_passes": sum(team_stats[t]["passes"]["total"] for t in team_stats),
            "total_drives": sum(team_stats[t]["drives"]["total"] for t in team_stats),
            "total_recoveries": sum(team_stats[t]["recoveries"] for t in team_stats)
        },
        "teams": dict(team_stats),
        "players": {
            team: dict(players)
            for team, players in player_stats.items()
        },
        "rankings": {
            "pass_accuracy": player_pass_accuracy_rank,
            "drive_success": player_drive_success_rank
        },
        "events": clean_events
    }

    output_json.parent.mkdir(parents=True, exist_ok=True)

    with open(output_json, "w") as f:
        json.dump(out, f, indent=2)

    return out