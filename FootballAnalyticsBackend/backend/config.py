from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]

BACKEND_DIR = ROOT_DIR / "backend"
ACTION_SPOTTING_DIR = ROOT_DIR / "action_spotting"

UPLOADS_DIR = ROOT_DIR / "uploads"
OUTPUTS_DIR = ROOT_DIR / "outputs"
TEMP_DIR = ROOT_DIR / "temp"
MODELS_DIR = ROOT_DIR / "models"

VIDEOS_OUTPUT_DIR = OUTPUTS_DIR / "videos"
JSON_OUTPUT_DIR = OUTPUTS_DIR / "json"
HEATMAPS_OUTPUT_DIR = OUTPUTS_DIR / "heatmaps"
PROJECTION_OUTPUT_DIR = OUTPUTS_DIR / "projection"

TRACKING_MODELS_DIR = MODELS_DIR / "tracking"
ACTION_MODELS_DIR = MODELS_DIR / "action_spotting"

YOLO_MODEL_PATH = TRACKING_MODELS_DIR / "yolo_best.pt"
KEYPOINT_MODEL_PATH = TRACKING_MODELS_DIR / "keypoints_best.pt"

INPUT_VIDEO_PATH = UPLOADS_DIR / "input_video.mp4"

BALL_ACTION_EVENTS_JSON = JSON_OUTPUT_DIR / "ball_action_events.json"
CLEAN_ACTION_EVENTS_JSON = JSON_OUTPUT_DIR / "match_action_events_clean.json"
ACTION_EVENTS_WITH_PLAYERS_JSON = JSON_OUTPUT_DIR / "action_events_with_players.json"
EVENT_STATS_WEB_JSON = JSON_OUTPUT_DIR / "event_stats_web.json"
POSSESSION_WEB_JSON = JSON_OUTPUT_DIR / "possession_web.json"
MATCH_STATS_JSON = JSON_OUTPUT_DIR / "match_stats.json"
FINAL_ANALYTICS_JSON = JSON_OUTPUT_DIR / "final_match_analytics_web.json"

FINAL_VIDEO_PATH = VIDEOS_OUTPUT_DIR / "final_video.webm"
PROJECTION_VIDEO_PATH = PROJECTION_OUTPUT_DIR / "projection_only_final.webm"

HEATMAP_POINTS_PATH = HEATMAPS_OUTPUT_DIR / "heatmap_points.pkl"
TEAM_ATTACK_DIRECTIONS_JSON = JSON_OUTPUT_DIR / "team_attack_directions.json"

PLAYER_CLASS = "player"
BALL_CLASS = "ball"
GK_CLASS = "goalkeeper"
REF_CLASS = "referee"

def ensure_dirs():
    for d in [
        UPLOADS_DIR,
        OUTPUTS_DIR,
        TEMP_DIR,
        VIDEOS_OUTPUT_DIR,
        JSON_OUTPUT_DIR,
        HEATMAPS_OUTPUT_DIR,
        PROJECTION_OUTPUT_DIR,
        TRACKING_MODELS_DIR,
        ACTION_MODELS_DIR,
    ]:
        d.mkdir(parents=True, exist_ok=True)


VIDEO_FPS = 25

REF_YELLOW = (0, 255, 255)
GK_LIGHT_GREEN = (0, 255, 0)
BALL_RED = (0, 0, 255)

TEAM_RED = (0, 0, 255)
TEAM_CYAN = (255, 255, 0)
