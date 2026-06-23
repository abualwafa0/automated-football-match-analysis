import json
import pickle
from collections import deque

import cv2

from backend.config import (
    INPUT_VIDEO_PATH,
    FINAL_VIDEO_PATH,
    PROJECTION_VIDEO_PATH,
    ACTION_EVENTS_WITH_PLAYERS_JSON,
    HEATMAP_POINTS_PATH,
    PLAYER_CLASS,
    BALL_CLASS,
    GK_CLASS,
    REF_CLASS,
    BALL_RED,
    GK_LIGHT_GREEN,
    REF_YELLOW,
)

from backend.tracking_pipeline.model_loader import load_tracking_model, load_keypoint_model
from backend.config import YOLO_MODEL_PATH, KEYPOINT_MODEL_PATH

from backend.tracking_pipeline.drawing import (
    draw_foot_arc,
    draw_ball_marker,
    draw_id_distance,
    draw_projection,
    create_pitch_canvas,
)

from backend.tracking_pipeline.team_classification import (
    train_team_kmeans,
    predict_team,
    extract_shirt_feature,
    get_team_color,
)

from backend.tracking_pipeline.tracking_core import (
    build_initial_roster,
    box_center,
    is_detection_overlapped,
    match_detections_to_roster_team_constrained,
)

from backend.tracking_pipeline.homography import (
    compute_homography,
    smooth_homography,
    project_point,
)

from backend.tracking_pipeline.distance import (
    init_player_stats,
    update_distance,
    save_stats,
)

from backend.tracking_pipeline.action_matching import (
    load_clean_action_events,
    build_action_frame_map,
    find_player_from_window,
    team_name_from_id,
    PASS_LOOKBACK_FRAMES,
    PASS_LOOKAHEAD_FRAMES,
    DRIVE_LOOKBACK_FRAMES,
    DRIVE_LOOKAHEAD_FRAMES,
)


def process_tracking_pipeline(
    video_path=INPUT_VIDEO_PATH,
    final_output_path=FINAL_VIDEO_PATH,
    projection_output_path=PROJECTION_VIDEO_PATH,
    action_output_json=ACTION_EVENTS_WITH_PLAYERS_JSON,
    heatmap_points_path=HEATMAP_POINTS_PATH,
):
    model = load_tracking_model(YOLO_MODEL_PATH)
    keypoint_model = load_keypoint_model(KEYPOINT_MODEL_PATH)

    print("Training K-Means...")
    kmeans = train_team_kmeans(
        model=model,
        video_path=video_path,
        frames_to_scan=120,
        conf=0.25
    )

    print("Building initial roster...")
    roster = build_initial_roster(
        model=model,
        kmeans=kmeans,
        video_path=video_path,
        frames_to_scan=120,
        conf=0.20
    )

    init_player_stats(roster)

    print("Processing video...")

    cap = cv2.VideoCapture(str(video_path))

    fps = cap.get(cv2.CAP_PROP_FPS)

    clean_action_events = load_clean_action_events()
    action_frame_map = build_action_frame_map(clean_action_events, fps)
    detected_action_events = {}

    print("Clean ACTION events:", len(clean_action_events))

    W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    final_output_path.parent.mkdir(parents=True, exist_ok=True)
    projection_output_path.parent.mkdir(parents=True, exist_ok=True)

    writer = cv2.VideoWriter(
        str(final_output_path),
        cv2.VideoWriter_fourcc(*"VP80"),
        fps,
        (W, H)
    )

    projection_scale = 10
    projection_template = create_pitch_canvas(scale=projection_scale)
    PH, PW = projection_template.shape[:2]

    projection_writer = cv2.VideoWriter(
        str(projection_output_path),
        cv2.VideoWriter_fourcc(*"VP80"),
        fps,
        (PW, PH)
    )

    MAX_GHOST_FRAMES = 90
    frame_idx = 0
    last_H = None

    contact_buffer = deque(
        maxlen=max(
            PASS_LOOKBACK_FRAMES + PASS_LOOKAHEAD_FRAMES,
            DRIVE_LOOKBACK_FRAMES + DRIVE_LOOKAHEAD_FRAMES
        ) + 10
    )

    while True:
        ok, frame = cap.read()

        if not ok:
            break

        H_new, h_score, kp_result = compute_homography(
            keypoint_model,
            frame,
            kp_conf_th=0.55
        )

        if H_new is not None:
            last_H = smooth_homography(last_H, H_new, alpha=0.08)

        H_use = last_H

        players_projected = []
        ball_projected = None

        ball_img = None
        players_img_for_action = []

        result = model.track(
            frame,
            persist=True,
            conf=0.20,
            iou=0.3,
            tracker="botsort.yaml",
            verbose=False
        )[0]

        names = result.names
        detections = []

        if result.boxes is not None:
            boxes = result.boxes.xyxy.cpu().numpy()
            classes = result.boxes.cls.cpu().numpy().astype(int)

            track_ids = None
            if result.boxes.id is not None:
                track_ids = result.boxes.id.cpu().numpy().astype(int)

            for i, box in enumerate(boxes):
                cls_id = int(classes[i])
                class_name = names[cls_id].lower()

                track_id = None
                if track_ids is not None:
                    track_id = int(track_ids[i])

                if class_name == PLAYER_CLASS:
                    predicted_team = predict_team(
                        kmeans,
                        frame,
                        box,
                        min_margin=0.10
                    )

                    if predicted_team is None:
                        continue

                    feat = extract_shirt_feature(frame, box)

                    if feat is None:
                        continue

                    detections.append({
                        "box": box,
                        "track_id": track_id,
                        "feature": feat,
                        "center": box_center(box),
                        "predicted_team": predicted_team,
                        "overlap": False
                    })

                elif class_name == BALL_CLASS:
                    draw_ball_marker(frame, box, BALL_RED)

                    x1, y1, x2, y2 = box
                    ball_center = ((x1 + x2) / 2, (y1 + y2) / 2)
                    ball_img = ball_center

                    if H_use is not None:
                        ball_projected = project_point(H_use, ball_center)

                elif class_name == GK_CLASS:
                    draw_foot_arc(frame, box, GK_LIGHT_GREEN)

                    if H_use is not None:
                        x1, y1, x2, y2 = box
                        foot_point = ((x1 + x2) / 2, y2)
                        gk_field_pos = project_point(H_use, foot_point)

                        if gk_field_pos is not None:
                            gx, gy = gk_field_pos
                            gk_team = "red" if gx < 52.5 else "cyan"

                            players_img_for_action.append({
                                "foot_img": foot_point,
                                "team": gk_team,
                                "display_id": "GK",
                                "role": "goalkeeper",
                                "count_stats": False,
                                "field_pos": gk_field_pos
                            })

                elif class_name == REF_CLASS:
                    draw_foot_arc(frame, box, REF_YELLOW)

        for i in range(len(detections)):
            detections[i]["overlap"] = is_detection_overlapped(
                detections[i],
                detections,
                i,
                iou_th=0.18,
                dist_th=30
            )

        matches = match_detections_to_roster_team_constrained(
            roster=roster,
            detections=detections,
            max_score=100
        )

        matched_roster_ids = set()

        for det_idx, roster_idx in matches.items():
            det = detections[det_idx]
            player = roster[roster_idx]

            if roster_idx in matched_roster_ids:
                continue

            matched_roster_ids.add(roster_idx)

            if det["overlap"] or det.get("instant_freeze", False):
                alpha = 0.0
                update_feature = False
                add_track = False
            else:
                alpha = 0.26
                update_feature = True
                add_track = True

            player.update(
                track_id=det["track_id"],
                feature=det["feature"],
                center=det["center"],
                box=det["box"],
                alpha=alpha,
                update_feature=update_feature,
                add_track=add_track
            )

            color = get_team_color(player.team_id)

            draw_foot_arc(frame, det["box"], color)

            field_pos = None

            x1, y1, x2, y2 = det["box"]
            foot_point = ((x1 + x2) / 2, y2)

            if H_use is not None:
                field_pos = project_point(H_use, foot_point)

            update_distance(player, field_pos)

            if field_pos is not None:
                player.heatmap_points.append(field_pos)

            draw_id_distance(
                frame,
                det["box"],
                player.display_id,
                player.total_distance_m,
                color
            )

            players_img_for_action.append({
                "foot_img": foot_point,
                "team": team_name_from_id(player.team_id),
                "display_id": player.display_id,
                "field_pos": field_pos
            })

            if field_pos is not None:
                players_projected.append({
                    "field_pos": field_pos,
                    "color": color,
                    "display_id": player.display_id
                })

        for i, player in enumerate(roster):
            if i not in matched_roster_ids:
                player.missing += 1

                if player.missing <= MAX_GHOST_FRAMES:
                    color = get_team_color(player.team_id)

                    draw_foot_arc(
                        frame,
                        player.box,
                        color,
                        r=9,
                        th=2
                    )

                    draw_id_distance(
                        frame,
                        player.box,
                        player.display_id,
                        player.total_distance_m,
                        color
                    )

                    x1, y1, x2, y2 = player.box
                    foot_point = ((x1 + x2) / 2, y2)

                    field_pos = None

                    if H_use is not None:
                        field_pos = project_point(H_use, foot_point)

                        update_distance(player, field_pos)

                        if field_pos is not None:
                            player.heatmap_points.append(field_pos)

                    players_img_for_action.append({
                        "foot_img": foot_point,
                        "team": team_name_from_id(player.team_id),
                        "display_id": player.display_id,
                        "field_pos": field_pos
                    })

                    if field_pos is not None:
                        players_projected.append({
                            "field_pos": field_pos,
                            "color": color,
                            "display_id": player.display_id
                        })

        contact_buffer.append({
            "frame_idx": frame_idx,
            "ball_img": ball_img,
            "players_img": players_img_for_action
        })

        cv2.putText(
            frame,
            f"Matched: {len(matches)}/20 | H:{h_score:.2f}",
            (20, H - 25),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 255),
            2,
            cv2.LINE_AA
        )

        projection_frame = draw_projection(
            players_projected=players_projected,
            ball_projected=ball_projected,
            scale=projection_scale
        )

        cv2.putText(
            projection_frame,
            f"H:{h_score:.2f} | Players:{len(players_projected)}/20",
            (20, PH - 20),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 255),
            2,
            cv2.LINE_AA
        )

        is_action_frame = frame_idx in action_frame_map

        if is_action_frame:
            for ev in action_frame_map[frame_idx]:
                event_id = ev["event_id"]

                if event_id not in detected_action_events:
                    player = find_player_from_window(
                        ev["event_frame"],
                        ev["label"],
                        contact_buffer
                    )

                    detected_action_events[event_id] = {
                        "event_id": event_id,
                        "label": ev["label"],
                        "time_sec": ev["event_time_sec"],
                        "frame_idx": frame_idx,
                        "event_frame": ev["event_frame"],
                        "confidence": ev["confidence"],
                        "gameTime": ev["gameTime"],
                        "player": player
                    }

        action_labels_on_frame = []

        if is_action_frame:
            action_labels_on_frame = [
                f'{ev["label"]} #{ev["event_id"]}'
                for ev in action_frame_map[frame_idx]
            ]

        

        projection_writer.write(projection_frame)
        writer.write(frame)

        frame_idx += 1

        if frame_idx % 100 == 0:
            print("Processed frames:", frame_idx)

    cap.release()
    writer.release()
    projection_writer.release()

    action_output_json.parent.mkdir(parents=True, exist_ok=True)

    action_events_output = {
        "source": "ball_action_spotting_plus_tracking",
        "method": "image_contact_window",
        "num_action_events": len(detected_action_events),
        "num_passes": sum(
            e["label"] == "PASS"
            for e in detected_action_events.values()
        ),
        "num_drives": sum(
            e["label"] == "DRIVE"
            for e in detected_action_events.values()
        ),
        "events": [
            detected_action_events[k]
            for k in sorted(detected_action_events.keys())
        ]
    }

    with open(action_output_json, "w") as f:
        json.dump(action_events_output, f, indent=2)

    print("Action events with players saved:", action_output_json)

    stats = save_stats(roster)

    heatmap_data = {}

    for p in roster:
        key = f"{p.team_id}_{p.display_id}"
        heatmap_data[key] = {
            "team_id": p.team_id,
            "display_id": p.display_id,
            "points": [
                [float(x), float(y)]
                for x, y in p.heatmap_points
            ]
        }

    heatmap_points_path.parent.mkdir(parents=True, exist_ok=True)

    with open(heatmap_points_path, "wb") as f:
        pickle.dump(heatmap_data, f)

    print("Heatmap points saved:", heatmap_points_path)
    print("Red total distance:", stats["red"]["total_distance_m"], "m")
    print("Cyan total distance:", stats["cyan"]["total_distance_m"], "m")
    print("Final video saved:", final_output_path)
    print("Projection video saved:", projection_output_path)

    return {
        "final_video": str(final_output_path),
        "projection_video": str(projection_output_path),
        "action_events_json": str(action_output_json),
        "heatmap_points": str(heatmap_points_path)
    }