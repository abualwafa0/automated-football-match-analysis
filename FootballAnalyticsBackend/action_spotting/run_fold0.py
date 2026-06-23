import json
import shutil
import subprocess
import sys
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parents[1]

ACTION_DIR = ROOT_DIR / "action_spotting"
REPO_DIR = ACTION_DIR / "repo" / "ball-action-spotting"

DEMO_GAME = "england_efl/2019-2020/demo-video"

DEMO_VIDEO_DIR = (
    REPO_DIR
    / "data"
    / "soccernet"
    / "spotting-ball-2023"
    / DEMO_GAME
)

DEMO_VIDEO_PATH = DEMO_VIDEO_DIR / "1_720p.mp4"

RESULT_JSON = (
    REPO_DIR
    / "data"
    / "ball_action"
    / "predictions"
    / "ball_finetune_long_004"
    / "demo"
    / "fold_0"
    / DEMO_GAME
    / "results_spotting.json"
)

OUTPUT_JSON = ROOT_DIR / "outputs" / "json" / "ball_action_events.json"


def convert_results_to_events(src_json, dst_json):
    with open(src_json, "r") as f:
        data = json.load(f)

    events = []

    for e in data["predictions"]:
        t = int(e["position"]) / 1000.0

        events.append({
            "time_sec": t,
            "frame_idx_25fps": int(t * 25),
            "label": e["label"],
            "confidence": float(e["confidence"]),
            "half": int(e["half"]),
            "gameTime": e["gameTime"]
        })

    events = sorted(events, key=lambda x: x["time_sec"])

    out = {
        "source": "ball_action_spotting",
        "fold": 0,
        "fps_used": 25,
        "num_events": len(events),
        "num_passes": sum(e["label"] == "PASS" for e in events),
        "num_drives": sum(e["label"] == "DRIVE" for e in events),
        "events": events
    }

    dst_json.parent.mkdir(parents=True, exist_ok=True)

    with open(dst_json, "w") as f:
        json.dump(out, f, indent=2)

    return out


def run_fold0(input_video, output_json=OUTPUT_JSON):
    input_video = Path(input_video)
    output_json = Path(output_json)

    if not input_video.exists():
        raise FileNotFoundError(f"Input video not found: {input_video}")

    DEMO_VIDEO_DIR.mkdir(parents=True, exist_ok=True)

    if DEMO_VIDEO_PATH.exists():
        DEMO_VIDEO_PATH.unlink()

    shutil.copy2(input_video, DEMO_VIDEO_PATH)

    predictions_dir = REPO_DIR / "data" / "ball_action" / "predictions"

    if predictions_dir.exists():
        shutil.rmtree(predictions_dir)

    cmd = [
        sys.executable,
        "scripts/ball_action/predict.py",
        "--experiment",
        "ball_finetune_long_004",
        "--folds",
        "0"
    ]

    env = dict(**dict())
    import os
    env = os.environ.copy()
    env["PYTHONPATH"] = str(REPO_DIR)

    subprocess.run(
        cmd,
        cwd=str(REPO_DIR),
        env=env,
        check=True
    )

    if not RESULT_JSON.exists():
        raise FileNotFoundError(f"Result JSON not found: {RESULT_JSON}")

    out = convert_results_to_events(RESULT_JSON, output_json)

    print("saved:", output_json)
    print("PASS:", out["num_passes"])
    print("DRIVE:", out["num_drives"])

    return out


if __name__ == "__main__":
    if len(sys.argv) < 2:
        raise SystemExit(
            "Usage: python action_spotting/run_fold0.py <input_video> [output_json]"
        )

    input_video = sys.argv[1]

    if len(sys.argv) >= 3:
        output_json = sys.argv[2]
    else:
        output_json = OUTPUT_JSON

    run_fold0(input_video, output_json)