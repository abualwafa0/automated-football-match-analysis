import json
import pickle
import cv2
import numpy as np

from backend.config import (
    HEATMAP_POINTS_PATH,
    HEATMAPS_OUTPUT_DIR,
    MATCH_STATS_JSON,
    TEAM_ATTACK_DIRECTIONS_JSON
)

from backend.tracking_pipeline.drawing import create_pitch_canvas, PITCH_W


def build_heat_matrix(points, scale=10, sigma=25):
    pitch_img = create_pitch_canvas(scale=scale)
    H, W = pitch_img.shape[:2]

    heat = np.zeros((H, W), dtype=np.float32)

    for x, y in points:
        px = int(x * scale)
        py = int(y * scale)

        if 0 <= px < W and 0 <= py < H:
            heat[py, px] += 1

    heat = cv2.GaussianBlur(
        heat,
        (0, 0),
        sigmaX=sigma
    )

    return heat


def get_attack_direction_from_hotspot(points, scale=10):
    if len(points) == 0:
        return "unknown", 0, None

    heat = build_heat_matrix(
        points,
        scale=scale,
        sigma=25
    )

    if heat.max() <= 0:
        return "unknown", 0, None

    max_idx = np.unravel_index(
        np.argmax(heat),
        heat.shape
    )

    hot_y, hot_x = max_idx
    hotspot_field_x = hot_x / scale

    if hotspot_field_x < PITCH_W / 2:
        return "right", 1, hotspot_field_x

    return "left", -1, hotspot_field_x


def draw_direction_arrow(img, direction):
    H, W = img.shape[:2]
    y = 25

    if direction == "right":
        start = (W // 2 - 38, y)
        end = (W // 2 + 38, y)
    elif direction == "left":
        start = (W // 2 + 38, y)
        end = (W // 2 - 38, y)
    else:
        return img

    cv2.arrowedLine(
        img,
        start,
        end,
        (255, 255, 255),
        3,
        tipLength=0.25
    )

    return img


def generate_heatmap_image(points, direction=None, scale=10):
    pitch_img = create_pitch_canvas(scale=scale)

    heat = build_heat_matrix(
        points,
        scale=scale,
        sigma=25
    )

    if heat.max() > 0:
        heat = heat / heat.max()

    heat_uint8 = np.uint8(255 * heat)

    colored = cv2.applyColorMap(
        heat_uint8,
        cv2.COLORMAP_JET
    )

    result = cv2.addWeighted(
        pitch_img,
        0.65,
        colored,
        0.35,
        0
    )

    if direction is not None:
        result = draw_direction_arrow(
            result,
            direction
        )

    return result


def generate_heatmaps(
    heatmap_points_path=HEATMAP_POINTS_PATH,
    heatmap_dir=HEATMAPS_OUTPUT_DIR,
    stats_json_path=MATCH_STATS_JSON,
    directions_json_path=TEAM_ATTACK_DIRECTIONS_JSON
):
    heatmap_dir.mkdir(parents=True, exist_ok=True)

    with open(heatmap_points_path, "rb") as f:
        heatmap_data = pickle.load(f)

    team_points = {
        0: [],
        1: []
    }

    for key, item in heatmap_data.items():
        team_id = item["team_id"]
        points = item["points"]
        team_points[team_id].extend(points)

    team_directions = {}

    for team_id in [0, 1]:
        team_name = "red" if team_id == 0 else "cyan"

        direction, forward_x_sign, hotspot_x = get_attack_direction_from_hotspot(
            team_points[team_id],
            scale=10
        )

        team_directions[team_id] = {
            "team_name": team_name,
            "attack_direction": direction,
            "forward_x_sign": forward_x_sign,
            "hotspot_x": hotspot_x
        }

        img = generate_heatmap_image(
            team_points[team_id],
            direction=direction,
            scale=10
        )

        out_path = heatmap_dir / f"team_{team_name}_heatmap.png"
        cv2.imwrite(str(out_path), img)

        print(
            f"TEAM {team_name}",
            "direction:",
            direction,
            "sign:",
            forward_x_sign,
            "hotspot_x:",
            None if hotspot_x is None else round(hotspot_x, 2)
        )

    for key, item in heatmap_data.items():
        team_id = item["team_id"]
        display_id = item["display_id"]
        points = item["points"]

        if len(points) < 3:
            continue

        team_name = "red" if team_id == 0 else "cyan"
        direction = team_directions[team_id]["attack_direction"]

        img = generate_heatmap_image(
            points,
            direction=direction,
            scale=10
        )

        out_path = heatmap_dir / f"{team_name}_{display_id}_heatmap.png"
        cv2.imwrite(str(out_path), img)

    directions_for_web = {
        "red": {
            "direction": team_directions[0]["attack_direction"],
            "forward_x_sign": team_directions[0]["forward_x_sign"],
            "hotspot_x": team_directions[0]["hotspot_x"]
        },
        "cyan": {
            "direction": team_directions[1]["attack_direction"],
            "forward_x_sign": team_directions[1]["forward_x_sign"],
            "hotspot_x": team_directions[1]["hotspot_x"]
        }
    }

    with open(directions_json_path, "w") as f:
        json.dump(directions_for_web, f, indent=2)

    with open(stats_json_path, "r") as f:
        stats = json.load(f)

    for team_id in [0, 1]:
        team_name = "red" if team_id == 0 else "cyan"

        if team_name in stats:
            stats[team_name]["attack_direction"] = team_directions[team_id]["attack_direction"]
            stats[team_name]["forward_x_sign"] = team_directions[team_id]["forward_x_sign"]
            stats[team_name]["hotspot_x"] = team_directions[team_id]["hotspot_x"]

            for p in stats[team_name]["players"]:
                p["attack_direction"] = team_directions[team_id]["attack_direction"]
                p["forward_x_sign"] = team_directions[team_id]["forward_x_sign"]

    with open(stats_json_path, "w") as f:
        json.dump(stats, f, indent=2)

    print("Heatmaps saved in:", heatmap_dir)
    print("Directions saved:", directions_json_path)
    print("Directions added to stats:", stats_json_path)

    return {
        "heatmap_dir": str(heatmap_dir),
        "directions": directions_for_web
    }