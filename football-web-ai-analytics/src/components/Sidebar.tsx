/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { MatchStatistics, PlayerSpeed } from '../types';
import { 
  Percent, 
  Activity, 
  TrendingUp, 
  User, 
  Zap, 
  Compass, 
  FileText, 
  ChevronLeft, 
  AlertTriangle 
} from 'lucide-react';

import { useLanguage } from '../contexts/LanguageContext';

interface SidebarProps {
  statistics: MatchStatistics;
  selectedPlayerId: number | null;
  setSelectedPlayerId: (id: number | null) => void;
}

export default function Sidebar({
  statistics,
  selectedPlayerId,
  setSelectedPlayerId,
}: SidebarProps) {
  const { t } = useLanguage();
  const { teamA, teamB } = statistics;
  const [activeTab, setActiveTab] = useState<'stats' | 'players'>('stats');
  const [sortBy, setSortBy] = useState<'number' | 'distance' | 'passAccuracy' | 'drivesAccuracy'>('number');

  const getSortedPlayers = (team: 'A' | 'B') => {
    let teamPlayers = statistics.players.filter(p => p.team === team);
    return teamPlayers.sort((a, b) => {
      if (sortBy === 'distance') return (b.distance || 0) - (a.distance || 0);
      if (sortBy === 'passAccuracy') return (b.passAccuracy || 0) - (a.passAccuracy || 0);
      if (sortBy === 'drivesAccuracy') return (b.drivesAccuracy || 0) - (a.drivesAccuracy || 0);
      return a.number - b.number;
    });
  };

  // Compute a custom insight based on real stats (Speed and Distance)
  const getTacticalInsight = () => {
    if (teamA.avgSpeed > teamB.avgSpeed && teamA.distanceCovered > teamB.distanceCovered) {
      return {
        title: t('controlAndSpeed'),
        text: t('insightSpeedText'),
        impact: "عالي", // Can be translated too if needed
        actionable: "يوصى للفريق ب بتقليل المسافات بين خطوط الدفاع لتعويض فارق السرعة الذي يستغله الفريق أ."
      };
    } else if (teamB.avgSpeed > teamA.avgSpeed) {
      return {
        title: "تحولات هجومية سريعة للفريق ب",
        text: `متوسط سرعة الفريق ب أعلى تكتيكياً (${teamB.avgSpeed} كم/س) مما يعطيه ميزة السرعة في التحولات العمودية السريعة والوصول السريع إلى المرمى. بينما يعتمد الفريق أ على إيقاع لعب أبطأ.`,
        impact: "متوسط",
        actionable: "استخدام تكتيك الضغط العالي المعاكس لمنع الفريق ب من الانطلاق السريع المرتد."
      };
    } else {
      return {
        title: t('tacticalBalance'),
        text: t('insightBalanceText'),
        impact: "متوسط",
        actionable: "محاولة استغلال الكرات الثابتة أو المهارات الفردية لكسر هذا التوازن الدفاعي."
      };
    }
  };

  const insight = getTacticalInsight();

  return (
    <aside className="w-full lg:w-96 shrink-0 bg-[#141414] border border-emerald-900/30 flex flex-col overflow-hidden rounded-xl shadow-xl shadow-black/40 lg:sticky lg:top-[90px] lg:h-[calc(100vh-110px)] lg:self-start">
      
      {/* Sidebar Navigation */}
      <div className="flex border-b border-emerald-900/20 p-2 shrink-0 gap-1 bg-black/30">
        <button
          onClick={() => setActiveTab('stats')}
          className={`flex-1 text-xs py-2 px-1 text-center rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${
            activeTab === 'stats' 
              ? 'bg-emerald-600 text-black font-bold' 
              : 'text-gray-400 hover:text-white hover:bg-emerald-950/20'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          {t('teamStats')}
        </button>
        <button
          onClick={() => setActiveTab('players')}
          className={`flex-1 text-xs py-2 px-1 text-center rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${
            activeTab === 'players' 
              ? 'bg-emerald-600 text-black font-bold' 
              : 'text-gray-400 hover:text-white hover:bg-emerald-950/20'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          {t('playerStats')}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        
        {/* TAB 1: GENERAL STATS */}
        {activeTab === 'stats' && (
          <div className="space-y-4 animate-fadeIn">
            
            <div className="flex items-center justify-between text-[11px] font-bold px-1 text-gray-400 mb-2">
              <span className="text-red-400 font-bold">{t('teamRed')}</span>
              <span className="font-mono text-[9px] bg-black/40 px-2 py-0.5 rounded text-gray-500 border border-emerald-900/20">{t('kpis')}</span>
              <span className="text-blue-400 font-bold">{t('teamBlue')}</span>
            </div>





            {/* Metric 1: Possession */}
            <div className="p-3.5 rounded-xl bg-black/20 border border-emerald-900/10 hover:border-emerald-500/20 transition-all duration-200">
              <div className="flex justify-between items-center text-xs font-bold mb-1">
                <span className="text-red-400 text-sm font-mono">{teamA.possession}%</span>
                <span className="text-gray-300 font-sans flex items-center gap-1">
                  <Percent className="w-3 h-3 text-emerald-400" /> {t('possession')}
                </span>
                <span className="text-blue-400 text-sm font-mono">{teamB.possession}%</span>
              </div>
            </div>

            {/* Metric 2: Passes */}
            <div className="p-3.5 rounded-xl bg-black/20 border border-emerald-900/10 hover:border-emerald-500/20 transition-all duration-200">
              <div className="flex justify-between items-center text-xs font-bold mb-1">
                <span className="text-red-400 text-sm font-mono">{teamA.passes}</span>
                <span className="text-gray-300 font-sans flex items-center gap-1">
                  <Activity className="w-3 h-3 text-emerald-400" /> {t('passes')}
                </span>
                <span className="text-blue-400 text-sm font-mono">{teamB.passes}</span>
              </div>
            </div>

            {/* Metric 3: Pass Accuracy */}
            <div className="p-3.5 rounded-xl bg-black/20 border border-emerald-900/10 hover:border-emerald-500/20 transition-all duration-200">
              <div className="flex justify-between items-center text-xs font-bold mb-1">
                <span className="text-red-400 text-sm font-mono">{teamA.passAccuracy}%</span>
                <span className="text-gray-300 font-sans flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-emerald-400" /> {t('passAccuracy')}
                </span>
                <span className="text-blue-400 text-sm font-mono">{teamB.passAccuracy}%</span>
              </div>
            </div>

            {/* Metric 4: Distance Covered */}
            <div className="p-3.5 rounded-xl bg-black/20 border border-emerald-900/10 hover:border-emerald-500/20 transition-all duration-200">
              <div className="flex justify-between items-center text-xs font-bold mb-1">
                <span className="text-red-400 text-sm font-mono">{teamA.distanceCovered} {t('meter')}</span>
                <span className="text-gray-300 font-sans flex items-center gap-1">
                  <Compass className="w-3 h-3 text-emerald-400" /> {t('distanceCovered')}
                </span>
                <span className="text-blue-400 text-sm font-mono">{teamB.distanceCovered} {t('meter')}</span>
              </div>
            </div>



          </div>
        )}

        {/* TAB 2: ACTIVE PLAYER PROFILES */}
        {activeTab === 'players' && (
          <div className="space-y-4 animate-fadeIn">
            
            <div className="flex flex-col gap-2 mb-4 px-1">
              <span className="text-[11px] text-emerald-400 font-bold">{t('sortBy')}</span>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setSortBy('number')}
                  className={`text-[10px] py-1.5 rounded border transition-all ${sortBy === 'number' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-black/30 border-emerald-900/30 text-gray-400 hover:border-emerald-500/50'}`}
                >{t('playerNumbers')}</button>
                <button 
                  onClick={() => setSortBy('distance')}
                  className={`text-[10px] py-1.5 rounded border transition-all ${sortBy === 'distance' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-black/30 border-emerald-900/30 text-gray-400 hover:border-emerald-500/50'}`}
                >{t('distance')}</button>
                <button 
                  onClick={() => setSortBy('passAccuracy')}
                  className={`text-[10px] py-1.5 rounded border transition-all ${sortBy === 'passAccuracy' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-black/30 border-emerald-900/30 text-gray-400 hover:border-emerald-500/50'}`}
                >{t('passRate')}</button>
                <button 
                  onClick={() => setSortBy('drivesAccuracy')}
                  className={`text-[10px] py-1.5 rounded border transition-all ${sortBy === 'drivesAccuracy' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-black/30 border-emerald-900/30 text-gray-400 hover:border-emerald-500/50'}`}
                >{t('driveSuccess')}</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pb-4">
              
              {/* Right Column: Team A (First in RTL) */}
              <div className="space-y-2.5">
                <div className="text-center pb-2 border-b border-red-900/30 mb-3">
                  <span className="text-xs font-bold text-red-400">{t('teamRed')}</span>
                </div>
                {getSortedPlayers('A').map((player) => {
                  const isSelected = selectedPlayerId === player.id;
                  return (
                    <div
                      key={player.id}
                      onClick={() => setSelectedPlayerId(isSelected ? null : player.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-red-500 bg-red-500/10'
                          : 'border-red-900/10 bg-black/20 hover:border-red-500/30'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1.5 text-center">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-mono text-sm font-bold bg-red-500/10 text-red-400 border border-red-500/30">
                          {player.number}
                        </div>
                        <div>
                          <span className="text-[11px] font-semibold text-gray-100 block">{t('player')} {player.number}</span>
                        </div>
                        <span className="text-[10px] text-red-400 font-mono font-bold bg-red-900/20 px-2 py-0.5 rounded mt-0.5 border border-red-900/30 w-full text-center">
                          {player.distance} {t('meter')}
                        </span>
                      </div>

                      {/* Expand details on select */}
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-red-500/20 text-[10px] text-gray-300 flex flex-col gap-2 animate-fadeIn text-right">
                          
                          <div className="bg-black/30 p-2 rounded border border-red-900/20">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] font-bold text-red-400">{t('passes')}</span>
                              <span className="text-[9px] font-mono">{player.passAccuracy || 0}% {t('accuracy')}</span>
                            </div>
                            <div className="flex justify-between text-[9px]">
                              <span className="text-gray-400">{t('total')}: {player.passes || 0}</span>
                              <span className="text-emerald-500">{t('successful')}: {player.passes_successful || 0}</span>
                              <span className="text-red-400">{t('failed')}: {player.passes_failed || 0}</span>
                            </div>
                          </div>

                          <div className="bg-black/30 p-2 rounded border border-red-900/20">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] font-bold text-red-400">{t('drives')}</span>
                              <span className="text-[9px] font-mono">{player.drivesAccuracy || 0}% {t('success')}</span>
                            </div>
                            <div className="flex justify-between text-[9px]">
                              <span className="text-gray-400">{t('total')}: {player.drives || 0}</span>
                              <span className="text-emerald-500">{t('successful')}: {player.drives_successful || 0}</span>
                              <span className="text-red-400">{t('failed')}: {player.drives_failed || 0}</span>
                            </div>
                          </div>

                          <div className="bg-black/30 p-2 rounded border border-red-900/20 flex justify-between items-center">
                            <span className="text-[10px] font-bold text-red-400">{t('recoveries')}</span>
                            <span className="font-semibold">{player.recoveries || 0} {t('times')}</span>
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Left Column: Team B (Second in RTL) */}
              <div className="space-y-2.5">
                <div className="text-center pb-2 border-b border-blue-900/30 mb-3">
                  <span className="text-xs font-bold text-blue-400">{t('teamBlue')}</span>
                </div>
                {getSortedPlayers('B').map((player) => {
                  const isSelected = selectedPlayerId === player.id;
                  return (
                    <div
                      key={player.id}
                      onClick={() => setSelectedPlayerId(isSelected ? null : player.id)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-blue-900/10 bg-black/20 hover:border-blue-500/30'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1.5 text-center">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-mono text-sm font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                          {player.number}
                        </div>
                        <div>
                          <span className="text-[11px] font-semibold text-gray-100 block">{t('player')} {player.number}</span>
                        </div>
                        <span className="text-[10px] text-blue-400 font-mono font-bold bg-blue-900/20 px-2 py-0.5 rounded mt-0.5 border border-blue-900/30 w-full text-center">
                          {player.distance} {t('meter')}
                        </span>
                      </div>

                      {/* Expand details on select */}
                      {isSelected && (
                        <div className="mt-3 pt-3 border-t border-blue-500/20 text-[10px] text-gray-300 flex flex-col gap-2 animate-fadeIn text-right">
                          
                          <div className="bg-black/30 p-2 rounded border border-blue-900/20">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] font-bold text-blue-400">{t('passes')}</span>
                              <span className="text-[9px] font-mono">{player.passAccuracy || 0}% {t('accuracy')}</span>
                            </div>
                            <div className="flex justify-between text-[9px]">
                              <span className="text-gray-400">{t('total')}: {player.passes || 0}</span>
                              <span className="text-blue-500">{t('successful')}: {player.passes_successful || 0}</span>
                              <span className="text-red-400">{t('failed')}: {player.passes_failed || 0}</span>
                            </div>
                          </div>

                          <div className="bg-black/30 p-2 rounded border border-blue-900/20">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] font-bold text-blue-400">{t('drives')}</span>
                              <span className="text-[9px] font-mono">{player.drivesAccuracy || 0}% {t('success')}</span>
                            </div>
                            <div className="flex justify-between text-[9px]">
                              <span className="text-gray-400">{t('total')}: {player.drives || 0}</span>
                              <span className="text-blue-500">{t('successful')}: {player.drives_successful || 0}</span>
                              <span className="text-red-400">{t('failed')}: {player.drives_failed || 0}</span>
                            </div>
                          </div>

                          <div className="bg-black/30 p-2 rounded border border-blue-900/20 flex justify-between items-center">
                            <span className="text-[10px] font-bold text-blue-400">{t('recoveries')}</span>
                            <span className="font-semibold">{player.recoveries || 0} {t('times')}</span>
                          </div>

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Footer Branding */}
      <div className="p-3 bg-black/40 border-t border-emerald-900/20 text-center shrink-0">
        <span className="text-[9px] text-gray-500 font-mono tracking-wider uppercase">
          Sports AI Vision System • RTL Active
        </span>
      </div>

    </aside>
  );
}
