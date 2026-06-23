import cv2
import numpy as np

from backend.config import BALL_RED

PITCH_W = 105
PITCH_H = 68


def draw_foot_arc(img, box, color, r=11, th=4, y_off=2):
    H, W = img.shape[:2]
    x1, y1, x2, y2 = [int(v) for v in box]

    x1 = max(0, min(W - 1, x1))
    y1 = max(0, min(H - 1, y1))
    x2 = max(0, min(W - 1, x2))
    y2 = max(0, min(H - 1, y2))

    fx = int((x1 + x2) * 0.5)
    fy = int(y2 + y_off)

    fx = max(0, min(W - 1, fx))
    fy = max(0, min(H - 1, fy))

    cv2.ellipse(img, (fx, fy), (r, r), 0, 0, 180, color, th)


def draw_ball_marker(img, box, color=BALL_RED, size=8, lift=15):
    x1, y1, x2, y2 = [int(v) for v in box]

    cx = int((x1 + x2) / 2)
    cy = int((y1 + y2) / 2 - lift)

    pts = np.array([
        (cx - size, cy - size),
        (cx + size, cy - size),
        (cx, cy + size)
    ], dtype=np.int32)

    cv2.fillPoly(img, [pts], color)


def create_pitch_canvas(scale=10):
    W = int(PITCH_W * scale)
    H = int(PITCH_H * scale)

    canvas = np.zeros((H, W, 3), dtype=np.uint8)
    canvas[:] = (30, 120, 30)

    white = (255, 255, 255)

    def pt(x, y):
        return int(x * scale), int(y * scale)

    cv2.rectangle(canvas, pt(0, 0), pt(PITCH_W, PITCH_H), white, 2)
    cv2.line(canvas, pt(PITCH_W / 2, 0), pt(PITCH_W / 2, PITCH_H), white, 1)
    cv2.circle(canvas, pt(PITCH_W / 2, PITCH_H / 2), int(9.15 * scale), white, 1)

    cv2.rectangle(canvas, pt(0, 13.84), pt(16.5, 54.16), white, 1)
    cv2.rectangle(canvas, pt(PITCH_W - 16.5, 13.84), pt(PITCH_W, 54.16), white, 1)

    cv2.rectangle(canvas, pt(0, 24.84), pt(5.5, 43.16), white, 1)
    cv2.rectangle(canvas, pt(PITCH_W - 5.5, 24.84), pt(PITCH_W, 43.16), white, 1)

    return canvas


def draw_projection(players_projected, ball_projected=None, scale=10):
    canvas = create_pitch_canvas(scale)

    for p in players_projected:
        x, y = p["field_pos"]
        color = p["color"]
        display_id = p["display_id"]

        px = int(x * scale)
        py = int(y * scale)

        cv2.circle(canvas, (px, py), 6, color, -1)

        if display_id is not None:
            cv2.putText(
                canvas,
                str(display_id),
                (px + 6, py - 6),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.45,
                (255, 255, 255),
                1,
                cv2.LINE_AA
            )

    if ball_projected is not None:
        bx, by = ball_projected
        cv2.circle(canvas, (int(bx * scale), int(by * scale)), 5, BALL_RED, -1)

    return canvas


def draw_id_distance(img, box, display_id, distance_m, bg_color):
    x1, y1, x2, y2 = [int(v) for v in box]

    text = f"#{display_id} | {int(distance_m)}m"
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 0.34
    th = 1
    pad = 3

    (w, h), _ = cv2.getTextSize(text, font, font_scale, th)

    bx1 = max(0, x1)
    by1 = max(0, y1 - h - 9)
    bx2 = min(img.shape[1] - 1, bx1 + w + 2 * pad)
    by2 = min(img.shape[0] - 1, by1 + h + 2 * pad)

    cv2.rectangle(img, (bx1, by1), (bx2, by2), bg_color, -1)

    cv2.putText(
        img,
        text,
        (bx1 + pad, by2 - pad),
        font,
        font_scale,
        (0, 0, 0),
        3,
        cv2.LINE_AA
    )

    cv2.putText(
        img,
        text,
        (bx1 + pad, by2 - pad),
        font,
        font_scale,
        (255, 255, 255),
        1,
        cv2.LINE_AA
    )