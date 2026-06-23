import cv2
import numpy as np

PITCH_W = 105.0
PITCH_H = 68.0

KP_WORLD = {
    29: (105.00, 68.00), 24: (105.00, 0.00),
    25: (105.00, 13.84), 26: (105.00, 24.84), 27: (105.00, 43.16), 28: (105.00, 54.16),
    22: (99.50, 24.84), 23: (99.50, 43.16),
    17: (88.50, 13.84), 20: (88.50, 54.16),
    21: (94.00, 34.00), 18: (88.50, 26.69), 19: (88.50, 41.31),
    30: (43.35, 34.00), 31: (61.65, 34.00),
    14: (52.50, 26.69), 15: (52.50, 41.31),
    13: (52.50, 0.00), 16: (52.50, 68.00),
    0: (0.00, 0.00), 5: (0.00, 68.00),
    1: (0.00, 13.84), 2: (0.00, 24.84), 3: (0.00, 43.16), 4: (0.00, 54.16),
    6: (5.50, 24.84), 7: (5.50, 43.16),
    9: (16.50, 13.84), 12: (16.50, 54.16),
    8: (11.00, 34.00), 10: (16.50, 26.69), 11: (16.50, 41.31),
}


def get_keypoints_from_result(result, kp_conf_th=0.55):
    image_points = []
    world_points = []

    if result.keypoints is None:
        return None, None

    if result.keypoints.xy is None or len(result.keypoints.xy) == 0:
        return None, None

    xy = result.keypoints.xy[0].cpu().numpy()

    conf = None
    if result.keypoints.conf is not None:
        conf = result.keypoints.conf[0].cpu().numpy()

    for kp_id, world_xy in KP_WORLD.items():
        if kp_id >= len(xy):
            continue

        px, py = xy[kp_id]

        if px <= 0 or py <= 0:
            continue

        if conf is not None and conf[kp_id] < kp_conf_th:
            continue

        image_points.append([px, py])
        world_points.append(list(world_xy))

    if len(image_points) < 4:
        return None, None

    return (
        np.array(image_points, dtype=np.float32),
        np.array(world_points, dtype=np.float32)
    )


def compute_homography(keypoint_model, frame, kp_conf_th=0.55):
    result = keypoint_model(frame, conf=0.25, verbose=False)[0]

    image_pts, world_pts = get_keypoints_from_result(result, kp_conf_th)

    if image_pts is None or world_pts is None:
        return None, 0.0, result

    H, mask = cv2.findHomography(image_pts, world_pts, cv2.RANSAC, 5.0)

    if H is None or mask is None:
        return None, 0.0, result

    inliers = int(mask.sum())
    total = len(mask)
    score = inliers / max(1, total)

    if inliers < 4 or score < 0.45:
        return None, score, result

    return H, score, result


def smooth_homography(prev_H, new_H, alpha=0.08):
    if prev_H is None:
        return new_H

    if new_H is None:
        return prev_H

    H = (1 - alpha) * prev_H + alpha * new_H
    H = H / H[2, 2]

    return H


def project_point(H, point):
    if H is None:
        return None

    src = np.array([[[point[0], point[1]]]], dtype=np.float32)
    dst = cv2.perspectiveTransform(src, H)[0][0]

    x, y = float(dst[0]), float(dst[1])

    if x < -5 or x > PITCH_W + 5 or y < -5 or y > PITCH_H + 5:
        return None

    x = max(0.0, min(PITCH_W, x))
    y = max(0.0, min(PITCH_H, y))

    return (x, y)