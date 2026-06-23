

# Automated Football Match Analysis

This project was developed as a graduation project with the goal of analyzing football matches automatically using computer vision and machine learning techniques.

The system takes a football match video as input and produces visual and statistical outputs that help understand player movement and match dynamics.

## Project Idea

The main objective of this project is to track players throughout the match, classify teams automatically, project player locations onto a real football field, and generate useful statistics and visualizations.

The project combines multiple components into a single pipeline that processes a match video from start to finish.

## What the System Does

### Player and Ball Detection

A custom YOLO model was trained to detect:

- Players
- Goalkeepers
- Referees
- Ball

### Player Tracking

Players are tracked across video frames using BoTSORT.

Additional logic was implemented to:

- Maintain stable player IDs
- Handle temporary occlusions
- Reduce ID switching during player overlaps

### Team Classification

Teams are classified automatically based on jersey colors using K-Means clustering and visual feature extraction.

Each player is assigned to one of the two teams and keeps a consistent team identity during the match.

### Homography and Field Projection

A separate keypoint detection model is used to estimate the football field geometry.

Using homography transformation, player positions are projected from the broadcast view into real field coordinates.

This allows the generation of a top-view tactical representation of the match.

### Match Statistics

The current version generates:

- Distance covered by each player
- Total distance covered by each team
- Player ranking based on distance covered

### Heatmaps

The system generates:

- Individual heatmaps for each player
- Team heatmaps showing overall activity distribution

### Ball Action Spotting

A pre-trained SoccerNet Ball Action Spotting model is integrated into the project.

The model detects events such as:

- PASS
- DRIVE

and exports the detected events with timestamps.

## Current Outputs

The system currently produces:

- Processed match video
- Projection video
- Match statistics JSON file
- Team heatmaps
- Individual player heatmaps
- Ball action spotting results

## Future Improvements

Future work may include:

- Pass statistics
- Ball possession analysis
- Forward and backward pass detection
- Team tactical analysis
- Additional football performance metrics

## Author

Khaled Abu Alwafa

Graduation Project
