import subprocess
from pathlib import Path

from backend.config import ensure_dirs, ROOT_DIR

# Import the analytics and tracking modules
from backend.analytics.clean_actions import clean_action_events
from backend.tracking_pipeline.tracking import process_tracking_pipeline
from backend.analytics.event_stats import compute_event_stats
from backend.analytics.possession import compute_possession
from backend.analytics.heatmaps import generate_heatmaps
from backend.analytics.merge_final_json import merge_final_analytics


def run_full_pipeline(video_path):
    ensure_dirs()

    print("========================================")
    print("Pipeline started")
    print("Input video:", video_path)
    print("========================================\n")

    # 1. Action Spotting
    import sys
    venv_action_python = ROOT_DIR / "venv_action" / "Scripts" / "python.exe"
    venv_action_python_alt = ROOT_DIR / "action_spotting" / "venv_action" / "Scripts" / "python.exe"
    
    if venv_action_python_alt.exists():
        venv_action_python = venv_action_python_alt
    elif not venv_action_python.exists():
        print("Notice: venv_action not found, falling back to current Python environment.")
        venv_action_python = Path(sys.executable)
        
    action_script = ROOT_DIR / "action_spotting" / "run_fold0.py"
    
    if action_script.exists():
        print(f">>> [1/6] Running Action Spotting with {venv_action_python}...")
        try:
            subprocess.run(
                [str(venv_action_python), str(action_script), str(video_path)],
                check=True
            )
            print("Action Spotting completed successfully.\n")
        except subprocess.CalledProcessError as e:
            print(f"Error during Action Spotting: {e}")
            # We don't raise here, we let the rest of the pipeline try to run
    else:
        print("Warning: action script not found. Skipping Action Spotting.\n")

    # 2. Clean Actions
    print(">>> [2/6] Running Clean Actions...")
    from backend.config import BALL_ACTION_EVENTS_JSON
    if BALL_ACTION_EVENTS_JSON.exists():
        clean_action_events()
        print("Clean Actions completed.\n")
    else:
        print("Error: ball_action_events.json not found! Clean Actions skipped.\n")

    # 3. Tracking Pipeline (YOLO Tracking, Homography, Projection)
    print(">>> [3/6] Running Tracking Pipeline (YOLO & Drawing)...")
    process_tracking_pipeline(video_path=video_path)
    print("Tracking Pipeline completed.\n")

    # 4. Event Stats & Possession
    print(">>> [4/6] Generating Event Stats & Possession...")
    compute_event_stats()
    compute_possession()
    print("Event Stats & Possession completed.\n")

    # 5. Heatmaps
    print(">>> [5/6] Generating Heatmaps...")
    generate_heatmaps()
    print("Heatmaps completed.\n")

    # 6. Merge Final JSON
    print(">>> [6/6] Merging Final Analytics JSON...")
    merge_final_analytics()
    print("Merge completed.\n")

    print("========================================")
    print("Full Pipeline executed successfully!")
    print("========================================")

    return {
        "status": "success",
        "video_path": str(video_path)
    }