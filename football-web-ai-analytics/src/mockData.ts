/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MatchStatistics, HeatmapData, TrackerEntity } from './types';

export const mockStatistics: MatchStatistics = {
  teamA: {
    possession: 56,
    passes: 412,
    passAccuracy: 86,
    avgSpeed: 23.4,
    distanceCovered: 108.4,
    shotsOnTarget: 7,
    fouls: 11,
    yellowCards: 1,
  },
  teamB: {
    possession: 44,
    passes: 328,
    passAccuracy: 78,
    avgSpeed: 21.9,
    distanceCovered: 105.1,
    shotsOnTarget: 4,
    fouls: 14,
    yellowCards: 3,
  },
  players: [
    { id: 1, number: 10, name: "يوسف الأنصاري", team: 'A', speed: 34.2, distance: 11.2, position: "مهاجم صريح" },
    { id: 2, number: 7, name: "عمر الحربي", team: 'A', speed: 32.8, distance: 10.8, position: "جناح أيمن" },
    { id: 3, number: 8, name: "خالد الدوسري", team: 'A', speed: 28.5, distance: 12.1, position: "صانع ألعاب" },
    { id: 4, number: 9, name: "كريم السعيد", team: 'B', speed: 33.1, distance: 10.4, position: "مهاجم" },
    { id: 5, number: 4, name: "أحمد المولد", team: 'B', speed: 31.5, distance: 9.8, position: "مدافع قلب" },
    { id: 6, number: 6, name: "فيصل العتيبي", team: 'A', speed: 29.1, distance: 11.5, position: "وسط مدافع" },
    { id: 7, number: 11, name: "فهد المري", team: 'B', speed: 32.2, distance: 10.1, position: "جناح أيسر" },
  ]
};

// Heatmap points (percentages 0-100)
export const mockHeatmaps: HeatmapData = {
  teamA: [
    { x: 30, y: 20, value: 0.6 },
    { x: 32, y: 22, value: 0.8 },
    { x: 35, y: 25, value: 0.9 },
    { x: 40, y: 35, value: 0.7 },
    { x: 50, y: 50, value: 0.85 },
    { x: 52, y: 53, value: 0.95 },
    { x: 55, y: 48, value: 0.7 },
    { x: 70, y: 30, value: 0.5 },
    { x: 75, y: 45, value: 0.8 },
    { x: 80, y: 50, value: 0.88 },
    { x: 82, y: 48, value: 0.99 }, // Hotspot near opponent goal
    { x: 85, y: 55, value: 0.75 },
    { x: 25, y: 50, value: 0.4 },
    { x: 60, y: 80, value: 0.65 },
    { x: 65, y: 78, value: 0.75 },
    { x: 72, y: 75, value: 0.6 }
  ],
  teamB: [
    { x: 70, y: 80, value: 0.6 },
    { x: 68, y: 78, value: 0.7 },
    { x: 65, y: 75, value: 0.85 },
    { x: 60, y: 65, value: 0.7 },
    { x: 50, y: 54, value: 0.8 },
    { x: 48, y: 47, value: 0.9 },
    { x: 45, y: 52, value: 0.75 },
    { x: 30, y: 70, value: 0.5 },
    { x: 25, y: 65, value: 0.75 },
    { x: 20, y: 50, value: 0.82 },
    { x: 18, y: 52, value: 0.94 }, // Hotspot near opponent goal
    { x: 15, y: 45, value: 0.7 },
    { x: 75, y: 50, value: 0.35 },
    { x: 40, y: 20, value: 0.55 },
    { x: 35, y: 22, value: 0.65 },
    { x: 28, y: 25, value: 0.5 }
  ],
  ball: [
    { x: 50, y: 50, value: 0.9 },
    { x: 52, y: 51, value: 0.8 },
    { x: 45, y: 48, value: 0.75 },
    { x: 35, y: 25, value: 0.7 },
    { x: 80, y: 49, value: 0.95 },
    { x: 82, y: 50, value: 0.99 },
    { x: 18, y: 51, value: 0.92 },
    { x: 65, y: 77, value: 0.8 },
    { x: 30, y: 21, value: 0.75 },
    { x: 55, y: 82, value: 0.6 },
    { x: 12, y: 50, value: 0.85 }, // Goalkeeper areas
    { x: 88, y: 50, value: 0.88 }
  ]
};

// Tactical tracking system (animated tracking frames simulation)
export interface FrameTracking {
  entities: TrackerEntity[];
}

export const mockTrackingTimeline: Record<number, TrackerEntity[]> = {
  // Keyframe sequences representing realistic team structures
  0: [
    { id: 10, team: 'A', x: 65, y: 45, name: "يوسف الأنصاري (10)", speed: 28.5 },
    { id: 7, team: 'A', x: 58, y: 25, name: "عمر الحربي (7)", speed: 31.2 },
    { id: 8, team: 'A', x: 48, y: 52, name: "خالد الدوسري (8)", speed: 18.2 },
    { id: 6, team: 'A', x: 38, y: 40, name: "فيصل العتيبي (6)", speed: 14.5 },
    { id: 9, team: 'B', x: 52, y: 48, name: "كريم السعيد (9)", speed: 22.0 },
    { id: 4, team: 'B', x: 68, y: 43, name: "أحمد المولد (4)", speed: 26.4 },
    { id: 11, team: 'B', x: 44, y: 65, name: "فهد المري (11)", speed: 16.8 },
    { id: 99, team: 'ball', x: 49, y: 51 }
  ],
  1: [
    { id: 10, team: 'A', x: 66, y: 44, name: "يوسف الأنصاري (10)", speed: 29.1 },
    { id: 7, team: 'A', x: 59, y: 24, name: "عمر الحربي (7)", speed: 31.8 },
    { id: 8, team: 'A', x: 49, y: 51, name: "خالد الدوسري (8)", speed: 19.4 },
    { id: 6, team: 'A', x: 39, y: 41, name: "فيصل العتيبي (6)", speed: 15.1 },
    { id: 9, team: 'B', x: 51, y: 49, name: "كريم السعيد (9)", speed: 22.5 },
    { id: 4, team: 'B', x: 67, y: 44, name: "أحمد المولد (4)", speed: 25.8 },
    { id: 11, team: 'B', x: 45, y: 64, name: "فهد المري (11)", speed: 17.2 },
    { id: 99, team: 'ball', x: 52, y: 48 }
  ],
  2: [
    { id: 10, team: 'A', x: 68, y: 42, name: "يوسف الأنصاري (10)", speed: 31.0 },
    { id: 7, team: 'A', x: 61, y: 22, name: "عمر الحربي (7)", speed: 32.4 },
    { id: 8, team: 'A', x: 51, y: 49, name: "خالد الدوسري (8)", speed: 22.1 },
    { id: 6, team: 'A', x: 41, y: 42, name: "فيصل العتيبي (6)", speed: 18.0 },
    { id: 9, team: 'B', x: 50, y: 50, name: "كريم السعيد (9)", speed: 24.1 },
    { id: 4, team: 'B', x: 69, y: 41, name: "أحمد المولد (4)", speed: 28.1 },
    { id: 11, team: 'B', x: 47, y: 62, name: "فهد المري (11)", speed: 19.5 },
    { id: 99, team: 'ball', x: 58, y: 35 }
  ],
  3: [
    { id: 10, team: 'A', x: 72, y: 40, name: "يوسف الأنصاري (10)", speed: 33.4 },
    { id: 7, team: 'A', x: 64, y: 21, name: "عمر الحربي (7)", speed: 32.8 },
    { id: 8, team: 'A', x: 54, y: 46, name: "خالد الدوسري (8)", speed: 24.5 },
    { id: 6, team: 'A', x: 43, y: 43, name: "فيصل العتيبي (6)", speed: 20.2 },
    { id: 9, team: 'B', x: 51, y: 52, name: "كريم السعيد (9)", speed: 23.8 },
    { id: 4, team: 'B', x: 72, y: 39, name: "أحمد المولد (4)", speed: 30.5 },
    { id: 11, team: 'B', x: 50, y: 60, name: "فهد المري (11)", speed: 21.0 },
    { id: 99, team: 'ball', x: 64, y: 22 }
  ],
  4: [
    { id: 10, team: 'A', x: 75, y: 41, name: "يوسف الأنصاري (10)", speed: 34.2 },
    { id: 7, team: 'A', x: 66, y: 23, name: "عمر الحربي (7)", speed: 31.0 },
    { id: 8, team: 'A', x: 57, y: 44, name: "خالد الدوسري (8)", speed: 25.1 },
    { id: 6, team: 'A', x: 45, y: 45, name: "فيصل العتيبي (6)", speed: 19.8 },
    { id: 9, team: 'B', x: 53, y: 55, name: "كريم السعيد (9)", speed: 21.4 },
    { id: 4, team: 'B', x: 75, y: 40, name: "أحمد المولد (4)", speed: 31.5 },
    { id: 11, team: 'B', x: 52, y: 58, name: "فهد المري (11)", speed: 22.2 },
    { id: 99, team: 'ball', x: 74, y: 38 }
  ]
};
