import os
import json
import shutil
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel

from backend.config import (
    UPLOADS_DIR,
    OUTPUTS_DIR,
    VIDEOS_OUTPUT_DIR,
    FINAL_ANALYTICS_JSON,
    HEATMAP_POINTS_PATH,
    ensure_dirs
)
from backend.run_pipeline import run_full_pipeline

app = FastAPI(title="Football Analytics API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (for dev, e.g., http://localhost:3000)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static directories
app.mount("/outputs", StaticFiles(directory=str(OUTPUTS_DIR)), name="outputs")

@app.on_event("startup")
def startup_event():
    ensure_dirs()

def get_mapped_analytics(video_id="latest"):
    statistics_mapped = {
        "teamA": { "possession": 50, "passes": 0, "passAccuracy": 0, "avgSpeed": 0, "distanceCovered": 0, "shotsOnTarget": 0, "fouls": 0, "yellowCards": 0 },
        "teamB": { "possession": 50, "passes": 0, "passAccuracy": 0, "avgSpeed": 0, "distanceCovered": 0, "shotsOnTarget": 0, "fouls": 0, "yellowCards": 0 },
        "players": []
    }
    heatmaps_mapped = {"teamA": [], "teamB": [], "ball": []}
    
    if FINAL_ANALYTICS_JSON.exists():
        try:
            with open(FINAL_ANALYTICS_JSON, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
                teams = data.get("teams", {})
                red = teams.get("red", {})
                cyan = teams.get("cyan", {})
                
                statistics_mapped["teamA"] = {
                    "possession": red.get("possession", {}).get("percent", 50),
                    "passes": red.get("passes", {}).get("total", 0),
                    "passAccuracy": red.get("passes", {}).get("accuracy_percent", 0),
                    "avgSpeed": 0,
                    "distanceCovered": int(red.get("distance", {}).get("total_distance_m", 0)),
                    "shotsOnTarget": 0,
                    "fouls": 0,
                    "yellowCards": 0
                }
                
                statistics_mapped["teamB"] = {
                    "possession": cyan.get("possession", {}).get("percent", 50),
                    "passes": cyan.get("passes", {}).get("total", 0),
                    "passAccuracy": cyan.get("passes", {}).get("accuracy_percent", 0),
                    "avgSpeed": 0,
                    "distanceCovered": int(cyan.get("distance", {}).get("total_distance_m", 0)),
                    "shotsOnTarget": 0,
                    "fouls": 0,
                    "yellowCards": 0
                }
                
                players_list = []
                global_player_id = 1
                for team_color, team_label in [("red", "A"), ("cyan", "B")]:
                    team_players = data.get("teams", {}).get(team_color, {}).get("distance", {}).get("players", [])
                    for pdata in team_players:
                        try:
                            pid = pdata.get("id")
                            if pid is None:
                                continue
                            dist_m = pdata.get("distance_m", 0)
                            dist_m_rounded = int(dist_m) if isinstance(dist_m, (int, float)) else 0
                            
                            pid_str = str(pid)
                            player_events = data.get("players", {}).get(team_color, {}).get(pid_str, {})
                            
                            passes = player_events.get("passes", {})
                            drives = player_events.get("drives", {})
                            
                            speed_kmh = 0
                            
                            players_list.append({
                                "id": global_player_id,
                                "number": int(pid),
                                "name": f"لاعب {pid}",
                                "team": team_label,
                                "speed": speed_kmh,
                                "distance": dist_m_rounded,
                                "position": "ميدان",
                                "passes": passes.get("total", 0),
                                "passes_successful": passes.get("successful", 0),
                                "passes_failed": passes.get("failed", 0),
                                "passAccuracy": passes.get("accuracy_percent", 0),
                                "drives": drives.get("total", 0),
                                "drives_successful": drives.get("successful", 0),
                                "drives_failed": drives.get("failed", 0),
                                "drivesAccuracy": drives.get("success_percent", 0),
                                "recoveries": player_events.get("recoveries", 0)
                            })
                            global_player_id += 1
                        except:
                            pass
                statistics_mapped["players"] = players_list
                
        except Exception as e:
            print(f"Failed to read analytics json: {e}")

    if HEATMAP_POINTS_PATH.exists():
        try:
            import pickle
            import numpy as np
            with open(HEATMAP_POINTS_PATH, "rb") as pf:
                hdata = pickle.load(pf)
                
            for team_id, team_key in [(0, "teamA"), (1, "teamB")]:
                team_pts = []
                for k, v in hdata.items():
                    if v.get("team_id") == team_id:
                        team_pts.extend(v.get("points", []))
                
                if team_pts:
                    pts_arr = np.array(team_pts)
                    H, xedges, yedges = np.histogram2d(pts_arr[:,0], pts_arr[:,1], bins=[40, 40], range=[[0, 105], [0, 68]])
                    max_val = H.max() if H.max() > 0 else 1
                    
                    for i in range(40):
                        for j in range(40):
                            if H[i,j] > 0:
                                x_m = (xedges[i] + xedges[i+1])/2
                                y_m = (yedges[j] + yedges[j+1])/2
                                heatmaps_mapped[team_key].append({
                                    "x": round((x_m / 105.0) * 100, 1),
                                    "y": round((y_m / 68.0) * 100, 1),
                                    "value": round(H[i,j] / max_val, 2)
                                })
        except Exception as e:
            print(f"Failed to process heatmap points: {e}")

    return {
        "video_id": video_id,
        "statistics": statistics_mapped,
        "heatmaps": heatmaps_mapped
    }

@app.post("/upload")
async def upload_video(file: UploadFile = File(...)):
    if not file.filename.endswith(('.mp4', '.avi', '.mov')):
        raise HTTPException(status_code=400, detail="Invalid file type. Only video files are allowed.")
    
    file_path = UPLOADS_DIR / file.filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        result = run_full_pipeline(file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline execution failed: {str(e)}")

    return get_mapped_analytics(file.filename)

@app.get("/latest")
async def get_latest():
    if not FINAL_ANALYTICS_JSON.exists():
        raise HTTPException(status_code=404, detail="No previous analysis found")
    return get_mapped_analytics("latest.webm")

@app.get("/video/{video_id}")
async def get_video(video_id: str):
    final_video = VIDEOS_OUTPUT_DIR / "final_video.webm"
    if final_video.exists():
        return FileResponse(final_video, media_type="video/webm")
    
    original_video = UPLOADS_DIR / video_id
    if original_video.exists():
        return FileResponse(original_video, media_type="video/mp4")
        
    raise HTTPException(status_code=404, detail="Video not found")

@app.get("/projection/{video_id}")
async def get_projection(video_id: str):
    from backend.config import PROJECTION_VIDEO_PATH
    if PROJECTION_VIDEO_PATH.exists():
        return FileResponse(PROJECTION_VIDEO_PATH, media_type="video/webm")
    raise HTTPException(status_code=404, detail="Projection video not found")
