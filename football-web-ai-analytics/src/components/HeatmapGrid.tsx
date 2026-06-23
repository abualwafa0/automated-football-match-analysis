/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { HeatmapData, HeatmapPoint, PlayerSpeed } from '../types';
import { Focus, Grid, HelpCircle, Layers, ZoomIn, Info } from 'lucide-react';

import { useLanguage } from '../contexts/LanguageContext';

interface HeatmapGridProps {
  data: HeatmapData;
  isLoading: boolean;
  apiEndpoint?: string;
  players?: PlayerSpeed[];
}

export default function HeatmapGrid({ data, isLoading, apiEndpoint, players }: HeatmapGridProps) {
  const { t } = useLanguage();
  const [showTeamA, setShowTeamA] = useState(true);
  const [showTeamB, setShowTeamB] = useState(true);
  const [showBall, setShowBall] = useState(true);

  return (
    <div className="bg-[#141414] p-5 rounded-2xl border border-emerald-900/30 mt-5 space-y-5 shadow-xl shadow-black/40">
      
      {/* Header of single Heatmap */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-900/20 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-sm font-bold text-gray-100 flex items-center gap-1.5 font-sans">
            <Layers className="w-4 h-4 text-emerald-400" />
            {t('unifiedHeatmapTitle')}
          </h2>
        </div>
        <div className="text-[11px] text-gray-400 flex items-center gap-1.5">
          <Grid className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t('heatmapDesc')}</span>
        </div>
      </div>

      {/* Main Layout: Master Heatmap */}
      <div className="flex flex-col gap-6 items-stretch">
        
        {/* Heatmap Area */}
        <div className="w-full bg-black/20 p-5 rounded-xl border border-emerald-900/15 flex flex-col justify-between">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <span className="text-xs font-bold text-gray-300">
              {t('heatmapDesc')}
            </span>
            <span className="text-[10px] bg-emerald-950 text-emerald-400 px-2.5 py-0.5 rounded border border-emerald-900/40 font-mono">
              Live Feed
            </span>
          </div>

          {/* Display Projection Video if data is available */}
          {!isLoading && data.teamA.length > 0 && apiEndpoint && (
            <div className="relative aspect-[3/2] w-full bg-[#0a0a0a] rounded-xl overflow-hidden border border-emerald-900/10 mb-4">
              <video
                src={`${new URL(apiEndpoint).origin}/projection/latest`}
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
              />
              <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 rounded text-[10px] text-emerald-400 font-mono border border-emerald-900/40">
                2D Projection
              </div>
            </div>
          )}

          <div className="relative aspect-[3/2] w-full bg-[#0a0a0a] rounded-xl overflow-hidden border border-emerald-900/10">
            <div className="absolute top-3 right-3 z-10 bg-black/60 px-3 py-1.5 rounded-md text-xs text-emerald-400 font-bold border border-emerald-900/30 backdrop-blur-md">
              {t('unifiedHeatmapTitle')}
            </div>
            <UnifiedFieldCanvas 
              teamAPoints={data.teamA}
              teamBPoints={data.teamB}
              ballPoints={data.ball}
              showTeamA={showTeamA}
              showTeamB={showTeamB}
              showBall={showBall}
              isLoading={isLoading} 
            />
          </div>

          <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-3 leading-relaxed text-right">
            <Info className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>
              {t('heatmapDesc')}
            </span>
          </div>
        </div>
      </div>

      {/* Static Image Heatmaps Selector */}
      <StaticHeatmapViewer apiEndpoint={apiEndpoint} players={players} isLoading={isLoading} data={data} />

    </div>
  );
}

function StaticHeatmapViewer({ apiEndpoint, players, isLoading, data }: any) {
  const { t } = useLanguage();
  const [selectedTeam, setSelectedTeam] = useState<'red' | 'cyan'>('red');
  const [selectedPlayer, setSelectedPlayer] = useState<'all' | string>('all');
  
  if (isLoading || !apiEndpoint || data.teamA.length === 0) return null;

  const serverUrl = new URL(apiEndpoint).origin;
  
  let imgName = '';
  if (selectedPlayer === 'all') {
    imgName = `team_${selectedTeam}_heatmap.png`;
  } else {
    imgName = `${selectedTeam}_${selectedPlayer}_heatmap.png`;
  }
  const imgUrl = `${serverUrl}/outputs/heatmaps/${imgName}`;

  const teamLabel = selectedTeam === 'red' ? 'A' : 'B';
  const teamPlayers = players?.filter((p: any) => p.team === teamLabel) || [];

  return (
    <div className="bg-black/20 p-5 rounded-xl border border-emerald-900/15 flex flex-col mt-6 shadow-lg">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4 border-b border-emerald-900/20 pb-3">
        
        {/* Right side (start in RTL) -> Player Dropdown */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-300">{t('viewOptions')}</label>
          <select 
            value={selectedPlayer}
            onChange={(e) => setSelectedPlayer(e.target.value)}
            className="bg-black border border-emerald-900/30 text-emerald-400 text-xs rounded px-2 py-1.5 outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">{t('wholeTeam')}</option>
            {teamPlayers.map((p: any) => (
              <option key={p.id} value={p.number.toString()}>
                {t('player')} {p.number}
              </option>
            ))}
          </select>
        </div>

        {/* Left side (end in RTL) -> Team Selection */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-300">{t('team')}</label>
          <div className="flex bg-black rounded border border-emerald-900/30 overflow-hidden">
            <button 
              onClick={() => { setSelectedTeam('red'); setSelectedPlayer('all'); }}
              className={`px-4 py-1.5 text-xs font-bold transition-colors ${selectedTeam === 'red' ? 'bg-emerald-600 text-black' : 'text-gray-400 hover:bg-emerald-900/20'}`}
            >
              {t('teamRedFirst')}
            </button>
            <button 
              onClick={() => { setSelectedTeam('cyan'); setSelectedPlayer('all'); }}
              className={`px-4 py-1.5 text-xs font-bold transition-colors border-r border-emerald-900/30 ${selectedTeam === 'cyan' ? 'bg-blue-500 text-black' : 'text-gray-400 hover:bg-blue-900/20'}`}
            >
              {t('teamBlueSecond')}
            </button>
          </div>
        </div>

      </div>

      <div className="relative aspect-[3/2] w-full bg-[#0a0a0a] rounded-xl overflow-hidden border border-emerald-900/10 flex items-center justify-center p-2">
        <img 
          src={imgUrl} 
          alt="Heatmap" 
          className="w-full h-full object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 100 100"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="5" fill="%23666">الخريطة الحرارية غير متوفرة لهذا اللاعب</text></svg>'; 
          }}
        />
      </div>
    </div>
  );
}

interface UnifiedCanvasProps {
  teamAPoints: HeatmapPoint[];
  teamBPoints: HeatmapPoint[];
  ballPoints: HeatmapPoint[];
  showTeamA: boolean;
  showTeamB: boolean;
  showBall: boolean;
  isLoading: boolean;
}

function UnifiedFieldCanvas({ 
  teamAPoints, 
  teamBPoints, 
  ballPoints, 
  showTeamA, 
  showTeamB, 
  showBall, 
  isLoading 
}: UnifiedCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fixed internal size for perfect quality
    const width = canvas.width = 600;
    const height = canvas.height = 400;

    // Background color
    ctx.fillStyle = '#09090b'; 
    ctx.fillRect(0, 0, width, height);

    if (isLoading) {
      // Draw grid mockup animation lines
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.05)';
      ctx.lineWidth = 1;
      for (let i = 0; i < width; i += 25) {
        ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
      }
      for (let j = 0; j < height; j += 25) {
        ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(width, j); ctx.stroke();
      }
      return;
    }

    // Draw Soccer Field Lines (Subtle stylish green-zinc tone)
    const strokeColor = 'rgba(16, 185, 129, 0.35)';
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.8;

    // Pitch borders
    ctx.strokeRect(15, 15, width - 30, height - 30);

    // Midfield line
    ctx.beginPath();
    ctx.moveTo(width / 2, 15);
    ctx.lineTo(width / 2, height - 15);
    ctx.stroke();

    // Center Circle
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 50, 0, 2 * Math.PI);
    ctx.stroke();

    // Center Point
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 2.5, 0, 2 * Math.PI);
    ctx.fillStyle = strokeColor;
    ctx.fill();

    // Box Left
    ctx.strokeRect(15, height / 2 - 35, 20, 70);
    ctx.strokeRect(15, height / 2 - 70, 60, 140);
    ctx.beginPath();
    ctx.arc(75, height / 2, 30, -0.4 * Math.PI, 0.4 * Math.PI);
    ctx.stroke();

    // Box Right
    ctx.strokeRect(width - 35, height / 2 - 35, 20, 70);
    ctx.strokeRect(width - 75, height / 2 - 70, 60, 140);
    ctx.beginPath();
    ctx.arc(width - 75, height / 2, 30, 0.6 * Math.PI, 1.4 * Math.PI);
    ctx.stroke();

    // Corner Arcs
    const r = 12;
    ctx.beginPath(); ctx.arc(15, 15, r, 0, 0.5 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(15, height - 15, r, 1.5 * Math.PI, 2 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(width - 15, 15, r, 0.5 * Math.PI, Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(width - 15, height - 15, r, Math.PI, 1.5 * Math.PI); ctx.stroke();

    // Helper function to draw point gradient
    const drawPoints = (points: HeatmapPoint[], colorTheme: 'emerald' | 'coral' | 'amber') => {
      points.forEach((pt) => {
        const px = 15 + (pt.x / 100) * (width - 30);
        const py = 15 + (pt.y / 100) * (height - 30);
        const radius = 35 + pt.value * 25;

        const gradient = ctx.createRadialGradient(px, py, 1, px, py, radius);
        
        let rgb = '8, 252, 136'; // Neon Emerald for Team A
        if (colorTheme === 'coral') {
          rgb = '59, 130, 246'; // Sapphire Blue for Team B
        } else if (colorTheme === 'amber') {
          rgb = '245, 158, 11'; // Warm Amber for Ball
        }

        const intensity = pt.value * 0.4;
        gradient.addColorStop(0, `rgba(${rgb}, ${intensity})`);
        gradient.addColorStop(0.3, `rgba(${rgb}, ${intensity * 0.55})`);

        // Draw hotspot red overlay if point is very intense
        if (pt.value > 0.88) {
          gradient.addColorStop(0, `rgba(239, 68, 68, 0.7)`);
          gradient.addColorStop(0.2, `rgba(${rgb}, 0.55)`);
        }
        gradient.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, 2 * Math.PI);
        ctx.fill();
      });
    };

    // Draw active layers sequentially for clean styling blend
    if (showTeamA) {
      drawPoints(teamAPoints, 'emerald');
    }
    if (showTeamB) {
      drawPoints(teamBPoints, 'coral');
    }
    if (showBall) {
      drawPoints(ballPoints, 'amber');
    }

  }, [teamAPoints, teamBPoints, ballPoints, showTeamA, showTeamB, showBall, isLoading]);

  return (
    <div className="w-full h-full flex items-center justify-center relative bg-[#09090b]">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 z-10 space-y-2">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px] text-zinc-400 font-sans">توليد المحاذاة الجغرافية الموحدة...</span>
        </div>
      )}
      <canvas ref={canvasRef} className="w-full h-full block object-contain" />
    </div>
  );
}
