import cv2
import numpy as np
from sklearn.cluster import KMeans
from collections import defaultdict, deque

from backend.config import PLAYER_CLASS, TEAM_RED, TEAM_CYAN


def extract_shirt_feature(frame, box):
    x1, y1, x2, y2 = [int(v) for v in box]
    H, W = frame.shape[:2]

    x1 = max(0, min(W - 1, x1))
    y1 = max(0, min(H - 1, y1))
    x2 = max(0, min(W - 1, x2))
    y2 = max(0, min(H - 1, y2))

    h = y2 - y1
    w = x2 - x1

    if h <= 12 or w <= 8:
        return None

    sx1 = x1 + int(0.28 * w)
    sx2 = x1 + int(0.72 * w)
    sy1 = y1 + int(0.18 * h)
    sy2 = y1 + int(0.50 * h)

    crop = frame[sy1:sy2, sx1:sx2]

    if crop.size == 0:
        return None

    crop = cv2.resize(crop, (32, 32))
    hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
    lab = cv2.cvtColor(crop, cv2.COLOR_BGR2LAB)

    hsv_pixels = hsv.reshape(-1, 3)
    lab_pixels = lab.reshape(-1, 3)

    mask = (
        (hsv_pixels[:, 2] > 45) &
        (hsv_pixels[:, 1] > 35) &
        ~((hsv_pixels[:, 0] > 35) & (hsv_pixels[:, 0] < 90) & (hsv_pixels[:, 1] > 45))
    )

    if mask.sum() < 40:
        return None

    hsv_valid = hsv_pixels[mask]
    lab_valid = lab_pixels[mask]

    feat = np.concatenate([
        np.mean(hsv_valid, axis=0),
        np.std(hsv_valid, axis=0),
        np.mean(lab_valid, axis=0),
        np.std(lab_valid, axis=0),
    ])

    return feat.astype(np.float32)


def get_team_color(team_id):
    return TEAM_RED if team_id == 0 else TEAM_CYAN


def train_team_kmeans(model, video_path, frames_to_scan=180, conf=0.30):
    cap = cv2.VideoCapture(str(video_path))
    features = []

    frame_idx = 0

    while frame_idx < frames_to_scan:
        ok, frame = cap.read()

        if not ok:
            break

        if frame_idx % 2 != 0:
            frame_idx += 1
            continue

        result = model(frame, conf=conf, verbose=False)[0]
        names = result.names

        if result.boxes is not None:
            boxes = result.boxes.xyxy.cpu().numpy()
            classes = result.boxes.cls.cpu().numpy().astype(int)
            confs = result.boxes.conf.cpu().numpy()

            for box, cls_id, score in zip(boxes, classes, confs):
                class_name = names[int(cls_id)].lower()

                if class_name != PLAYER_CLASS:
                    continue

                if score < conf:
                    continue

                feat = extract_shirt_feature(frame, box)

                if feat is not None:
                    features.append(feat)

        frame_idx += 1

    cap.release()

    if len(features) < 30:
        raise ValueError("Not enough good player samples for K-Means.")

    X = np.array(features, dtype=np.float32)

    mean = X.mean(axis=0)
    std = X.std(axis=0) + 1e-6
    Xn = (X - mean) / std

    kmeans = KMeans(
        n_clusters=2,
        random_state=42,
        n_init=30,
        max_iter=500
    )

    kmeans.fit(Xn)

    return {
        "model": kmeans,
        "mean": mean,
        "std": std
    }


def predict_team(kmeans_pack, frame, box, min_margin=0.25):
    feat = extract_shirt_feature(frame, box)

    if feat is None:
        return None

    X = np.array([feat], dtype=np.float32)
    Xn = (X - kmeans_pack["mean"]) / kmeans_pack["std"]

    centers = kmeans_pack["model"].cluster_centers_
    dists = np.linalg.norm(centers - Xn[0], axis=1)
    order = np.argsort(dists)

    best = order[0]
    second = order[1]

    margin = dists[second] - dists[best]

    if margin < min_margin:
        return None

    return int(best)
class TeamLockManager:
    def __init__(self, window_size=10, min_votes=8):
        self.window_size = window_size
        self.min_votes = min_votes
        self.votes = defaultdict(lambda: deque(maxlen=window_size))
        self.locked_team = {}

    def update(self, track_id, predicted_team):
        if track_id is None or predicted_team is None:
            return None, False

        if track_id in self.locked_team:
            return self.locked_team[track_id], True

        self.votes[track_id].append(predicted_team)

        votes = list(self.votes[track_id])

        if votes.count(0) >= self.min_votes:
            self.locked_team[track_id] = 0
            return 0, True

        if votes.count(1) >= self.min_votes:
            self.locked_team[track_id] = 1
            return 1, True

        return predicted_team, False