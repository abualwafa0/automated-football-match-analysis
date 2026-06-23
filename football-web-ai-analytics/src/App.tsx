/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import DashboardHeader from './components/DashboardHeader';
import VideoSection from './components/VideoSection';
import Sidebar from './components/Sidebar';
import HeatmapGrid from './components/HeatmapGrid';
import { MatchStatistics, HeatmapData } from './types';
import { mockStatistics, mockHeatmaps } from './mockData';
import { Info, HelpCircle, Activity } from 'lucide-react';
import { useLanguage } from './contexts/LanguageContext';
import LandingPage from './components/LandingPage';
import { AnimatePresence, motion } from 'motion/react';

const initialHeatmaps: HeatmapData = {
  teamA: [],
  teamB: [],
  ball: []
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<'landing' | 'app'>('landing');
  const [isSimulator, setIsSimulator] = useState<boolean>(false);
  const [apiEndpoint, setApiEndpoint] = useState<string>("http://127.0.0.1:8000/upload");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  
  // App-level state for stats and heatmaps
  const [statistics, setStatistics] = useState<MatchStatistics>(() => {
    const saved = localStorage.getItem('football_stats');
    if (saved) return JSON.parse(saved);
    return { teamA: { possession: 0, passes: 0, passAccuracy: 0, avgSpeed: 0, distanceCovered: 0, shotsOnTarget: 0, fouls: 0, yellowCards: 0 }, teamB: { possession: 0, passes: 0, passAccuracy: 0, avgSpeed: 0, distanceCovered: 0, shotsOnTarget: 0, fouls: 0, yellowCards: 0 }, players: [] };
  });
  const [heatmaps, setHeatmaps] = useState<HeatmapData>(() => {
    const saved = localStorage.getItem('football_heatmaps');
    if (saved) return JSON.parse(saved);
    return initialHeatmaps;
  });
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);

  // Callback after uploading and analyzing a new video successfully
  const handleAnalysisSuccess = (newStats: MatchStatistics, newHeatmaps: HeatmapData) => {
    setStatistics(newStats);
    setHeatmaps(newHeatmaps);
    localStorage.setItem('football_stats', JSON.stringify(newStats));
    localStorage.setItem('football_heatmaps', JSON.stringify(newHeatmaps));
  };

  const { t, language } = useLanguage();

  return (
    <div className={`min-h-screen bg-[#0a0a0a] text-zinc-200 font-sans selection:bg-emerald-500/30 flex flex-col ${language === 'ar' ? 'rtl' : 'ltr'}`}>
      
      <AnimatePresence mode="wait">
        {currentPage === 'landing' ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }}
            transition={{ duration: 0.6 }}
            className="flex-1 flex flex-col"
          >
            <LandingPage onStart={() => setCurrentPage('app')} />
          </motion.div>
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-1 flex flex-col"
          >
            {/* Dynamic Header Component */}
            <DashboardHeader 
              isSimulator={isSimulator}
              setIsSimulator={setIsSimulator}
              apiEndpoint={apiEndpoint}
              setApiEndpoint={setApiEndpoint}
              isAnalyzing={isAnalyzing}
            />

            {/* Main Layout Area */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col lg:flex-row-reverse gap-6">
              
              {/* Right Section (Main Content Area): Video top, Heatmaps bottom */}
              <div className="flex-1 flex flex-col gap-6">
                
                {/* Actionable Video Feed with Canvas tracking boxes */}
                <VideoSection 
                  isSimulator={isSimulator}
                  apiEndpoint={apiEndpoint}
                  onAnalysisSuccess={handleAnalysisSuccess}
                  isAnalyzing={isAnalyzing}
                  setIsAnalyzing={setIsAnalyzing}
                  selectedPlayerId={selectedPlayerId}
                />

                {/* Interactive Heatmap Grids */}
                <HeatmapGrid 
                  data={heatmaps} 
                  isLoading={isAnalyzing}
                  apiEndpoint={apiEndpoint}
                  players={statistics.players}
                />

              </div>

              {/* Left Section (Sidebar): Statistics & Player lists */}
              <Sidebar 
                statistics={statistics}
                selectedPlayerId={selectedPlayerId}
                setSelectedPlayerId={setSelectedPlayerId}
              />

            </main>

            {/* System Helper Tips */}
            <footer className="bg-[#0a0a0a] border-t border-emerald-900/30 py-4 px-6 text-center text-xs text-zinc-500 mt-auto">
              <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-zinc-400">
                <p className="text-[11px] text-zinc-600">
                  {t('footerText')}
                </p>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
