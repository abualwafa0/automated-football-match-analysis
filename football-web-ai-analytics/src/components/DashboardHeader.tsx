/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Activity, ShieldAlert, Cpu, Server, Wifi, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

import ahmadImg from '../assets/team/Ahmad_Hazaymeh_v2.jpeg';
import amroImg from '../assets/team/Amro Al-Jarrah.jpeg';
import khaledImg from '../assets/team/Khalad Abualwafa.jpeg';
import osamhImg from '../assets/team/OSAMH AL SHRA\'H.jpeg';
import omarImg from '../assets/team/Omar Dakhlallah.png';

const teamMembers = [
  { name: 'Ahmad Hazaymeh', img: ahmadImg },
  { name: 'Amro Al-Jarrah', img: amroImg },
  { name: 'Khalad Abualwafa', img: khaledImg },
  { name: "OSAMH AL SHRA'H", img: osamhImg },
  { name: 'Omar Dakhlallah', img: omarImg },
];

interface HeaderProps {
  isSimulator: boolean;
  setIsSimulator: (val: boolean) => void;
  apiEndpoint: string;
  setApiEndpoint: (val: string) => void;
  isAnalyzing: boolean;
}

export default function DashboardHeader({
  isSimulator,
  setIsSimulator,
  apiEndpoint,
  setApiEndpoint,
  isAnalyzing,
}: HeaderProps) {
  const { language, setLanguage, t } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  return (
    <header className="border-b border-emerald-900/50 bg-[#0a0a0a]/90 backdrop-blur-md p-4 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Title and Branding */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-2 w-10 h-10 bg-emerald-600 rounded flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold font-sans tracking-tight text-emerald-400 flex items-center gap-2">
              {t('title')}
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {t('subtitle')}
            </p>
          </div>
        </div>

        {/* Team Members Compact */}
        <div className="flex items-center justify-center gap-6 w-full md:w-auto mt-4 md:mt-0 px-4">
          {teamMembers.map((member, idx) => (
            <div key={idx} className="flex flex-col items-center gap-2 group cursor-pointer">
              <img 
                src={member.img} 
                alt={member.name} 
                className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-[3px] border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)] group-hover:scale-110 group-hover:border-emerald-400 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all duration-300"
              />
              <span className="text-sm md:text-base text-zinc-400 group-hover:text-emerald-400 transition-colors font-semibold whitespace-nowrap mt-1">
                {member.name}
              </span>
            </div>
          ))}
        </div>

        {/* Configurations and Mode Toggle */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end mt-2 md:mt-0">
          
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 bg-[#141414]/80 border border-emerald-900/40 hover:border-emerald-500/50 transition-colors rounded-xl p-2.5 text-xs text-emerald-400"
          >
            <Globe className="w-4 h-4" />
            <span className="font-bold">{language === 'ar' ? 'English' : 'العربية'}</span>
          </button>

          {/* System status node */}
          <div className="flex items-center gap-1.5 bg-[#141414]/80 border border-emerald-900/40 rounded-xl p-2.5 text-xs">
            {isAnalyzing ? (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                </span>
                <span className="text-amber-400 font-medium font-sans">{t('analyzing')}</span>
              </>
            ) : (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-500 font-medium font-sans">{t('modelConnected')}</span>
              </>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
