import cv2
import numpy as np
from scipy.optimize import linear_sum_assignment

from backend.config import PLAYER_CLASS
from backend.tracking_pipeline.team_classification import (
    extract_shirt_feature,
    predict_team
)


class DisplayIDManager:
    def __init__(self, max_players_per_team=10):
        self.max_players_per_team = max_players_per_team
        self.track_to_display = {}
        self.next_id = {0: 1, 1: 1}

    def get_display_id(self, track_id, team_id):
        if track_id is None or team_id is None:
            return None

        if track_id in self.track_to_display:
            old_team, display_id = self.track_to_display[track_id]
            return display_id

        if self.next_id[team_id] > self.max_players_per_team:
            return None

        display_id = self.next_id[team_id]
        self.next_id[team_id] += 1

        self.track_to_display[track_id] = (team_id, display_id)

        return display_id


class RosterPlayer:
    def __init__(self, team_id, display_id, track_id, feature, center, box):
        self.team_id = team_id
        self.display_id = display_id
        self.track_ids = set()

        if track_id is not None:
            self.track_ids.add(track_id)

        self.feature = np.array(feature, dtype=np.float32)
        self.center = np.array(center, dtype=np.float32)
        self.prev_center = np.array(center, dtype=np.float32)
        self.velocity = np.array([0, 0], dtype=np.float32)

        self.box = np.array(box, dtype=np.float32)
        self.missing = 0
        self.frozen = False

        self.total_distance_m = 0.0
        self.current_speed_kmh = 0.0
        self.max_speed_kmh = 0.0
        self.last_field_pos = None
        self.heatmap_points = []

    def predicted_center(self):
        return self.center + self.velocity

    def update(self, track_id, feature, center, box, alpha=0.12, update_feature=True, add_track=True):
        if add_track and track_id is not None:
            self.track_ids.add(track_id)

        center = np.array(center, dtype=np.float32)

        self.velocity = center - self.center
        self.prev_center = self.center.copy()
        self.center = (1 - alpha) * self.center + alpha * center

        if update_feature and feature is not None:
            self.feature = (1 - alpha) * self.feature + alpha * np.array(feature, dtype=np.float32)

        self.box = np.array(box, dtype=np.float32)
        self.missing = 0


def box_center(box):
    x1, y1, x2, y2 = box
    return np.array([(x1 + x2) / 2, (y1 + y2) / 2], dtype=np.float32)


def build_initial_roster(model, kmeans, video_path, frames_to_scan=80, conf=0.30):
    cap = cv2.VideoCapture(str(video_path))
    track_samples = {}
    frame_idx = 0

    while frame_idx < frames_to_scan:
        ok, frame = cap.read()

        if not ok:
            break

        result = model.track(
            frame,
            persist=True,
            conf=conf,
            iou=0.5,
            tracker="botsort.yaml",
            verbose=False
        )[0]

        names = result.names

        if result.boxes is not None:
            boxes = result.boxes.xyxy.cpu().numpy()
            classes = result.boxes.cls.cpu().numpy().astype(int)

            track_ids = None
            if result.boxes.id is not None:
                track_ids = result.boxes.id.cpu().numpy().astype(int)

            for i, box in enumerate(boxes):
                cls_id = int(classes[i])
                class_name = names[cls_id].lower()

                if class_name != PLAYER_CLASS:
                    continue

                if track_ids is None:
                    continue

                track_id = int(track_ids[i])
                feat = extract_shirt_feature(frame, box)

                if feat is None:
                    continue

                team_id = predict_team(kmeans, frame, box)

                if team_id is None:
                    continue

                center = box_center(box)

                if track_id not in track_samples:
                    track_samples[track_id] = {
                        "features": [],
                        "centers": [],
                        "boxes": [],
                        "teams": []
                    }

                track_samples[track_id]["features"].append(feat)
                track_samples[track_id]["centers"].append(center)
                track_samples[track_id]["boxes"].append(box)
                track_samples[track_id]["teams"].append(team_id)

        frame_idx += 1

    cap.release()

    candidates = []

    for track_id, data in track_samples.items():
        if len(data["features"]) < 4:
            continue

        team_votes = data["teams"]
        team_id = max(set(team_votes), key=team_votes.count)

        candidates.append({
            "track_id": track_id,
            "team_id": team_id,
            "feature": np.mean(data["features"], axis=0),
            "center": np.mean(data["centers"], axis=0),
            "box": data["boxes"][-1],
            "count": len(data["features"])
        })

    roster = []

    for team_id in [0, 1]:
        team_candidates = [c for c in candidates if c["team_id"] == team_id]
        team_candidates = sorted(team_candidates, key=lambda x: x["count"], reverse=True)
        team_candidates = team_candidates[:10]

        for idx, c in enumerate(team_candidates, start=1):
            roster.append(
                RosterPlayer(
                    team_id=team_id,
                    display_id=idx,
                    track_id=c["track_id"],
                    feature=c["feature"],
                    center=c["center"],
                    box=c["box"]
                )
            )

    print("Roster built:")
    print("Team 0:", len([p for p in roster if p.team_id == 0]))
    print("Team 1:", len([p for p in roster if p.team_id == 1]))

    return roster


def position_distance(c1, c2):
    return np.linalg.norm(np.array(c1) - np.array(c2))


def feature_distance(f1, f2):
    return np.linalg.norm(np.array(f1) - np.array(f2))


def match_score(player, det):
    predicted = player.predicted_center()

    pos_d = position_distance(predicted, det["center"])
    color_d = feature_distance(player.feature, det["feature"])

    track_bonus = 0
    if det["track_id"] is not None and det["track_id"] in player.track_ids:
        track_bonus = -120

    return 0.75 * pos_d + 0.25 * color_d + track_bonus


def match_detections_to_roster_team_constrained(roster, detections, max_score=100):
    matches = {}

    for team_id in [0, 1]:
        roster_indices = [
            i for i, p in enumerate(roster)
            if p.team_id == team_id
        ]

        detection_indices = [
            j for j, d in enumerate(detections)
            if d.get("predicted_team") == team_id
        ]

        if len(roster_indices) == 0 or len(detection_indices) == 0:
            continue

        cost = np.zeros((len(roster_indices), len(detection_indices)), dtype=np.float32)

        for r_local, r_idx in enumerate(roster_indices):
            for d_local, d_idx in enumerate(detection_indices):
                cost[r_local, d_local] = match_score(roster[r_idx], detections[d_idx])

        row_ind, col_ind = linear_sum_assignment(cost)

        for r_local, d_local in zip(row_ind, col_ind):
            score = cost[r_local, d_local]

            if score <= max_score:
                real_det_idx = detection_indices[d_local]
                real_roster_idx = roster_indices[r_local]
                matches[real_det_idx] = real_roster_idx

    return matches


def bbox_iou(boxA, boxB):
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2])
    yB = min(boxA[3], boxB[3])

    interW = max(0, xB - xA)
    interH = max(0, yB - yA)
    interArea = interW * interH

    areaA = max(1, (boxA[2] - boxA[0]) * (boxA[3] - boxA[1]))
    areaB = max(1, (boxB[2] - boxB[0]) * (boxB[3] - boxB[1]))

    return interArea / float(areaA + areaB - interArea)


def is_detection_overlapped(det, detections, i, iou_th=0.18, dist_th=35):
    for j, other in enumerate(detections):
        if i == j:
            continue

        iou = bbox_iou(det["box"], other["box"])
        dist = np.linalg.norm(det["center"] - other["center"])

        if iou > iou_th or dist < dist_th:
            return True

    return False