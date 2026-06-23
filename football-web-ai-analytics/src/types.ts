/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TeamStats {
  possession: number; // percentage (e.g. 54)
  passes: number;
  passAccuracy: number; // percentage (e.g. 82)
  avgSpeed: number; // km/h (e.g. 22.5)
  distanceCovered: number; // km (e.g. 104.2)
  shotsOnTarget: number;
  fouls: number;
  yellowCards: number;
}

export interface PlayerSpeed {
  id: number;
  number: number;
  name: string;
  team: 'A' | 'B';
  speed: number; // km/h (e.g. 31.8)
  distance: number; // km (e.g. 9.4)
  position: string;
  passes?: number;
  passes_successful?: number;
  passes_failed?: number;
  passAccuracy?: number;
  drives?: number;
  drives_successful?: number;
  drives_failed?: number;
  drivesAccuracy?: number;
  recoveries?: number;
}

export interface MatchStatistics {
  teamA: TeamStats;
  teamB: TeamStats;
  players: PlayerSpeed[];
}

export interface HeatmapPoint {
  x: number; // 0 to 100 percentage of width
  y: number; // 0 to 100 percentage of height
  value: number; // intensity 0 to 1
}

export interface HeatmapData {
  teamA: HeatmapPoint[];
  teamB: HeatmapPoint[];
  ball: HeatmapPoint[];
}

export interface AnalysisResponse {
  processed_video_url: string;
  statistics: MatchStatistics;
  heatmaps: string[]; // fallback image URLs in case the API provides them
  // We will also use canvas-designed heatmaps for gorgeous interactive visualization
}

export interface TrackerEntity {
  id: number;
  team: 'A' | 'B' | 'ball' | 'referee';
  x: number; // percentage of video width
  y: number; // percentage of video height
  name?: string;
  speed?: number; // current speed
}
