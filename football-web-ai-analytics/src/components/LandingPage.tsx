import React from 'react';
import { motion } from 'motion/react';
import { useLanguage } from '../contexts/LanguageContext';
import { PlayCircle, Shield, Activity, Target } from 'lucide-react';
import bgImage from '../../image/image copy.png';
import logoImage from '../../image/image.png';
import leftLogoImage from '../../image/OIP.png';

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

interface LandingPageProps {
  onStart: () => void;
}

export default function LandingPage({ onStart }: LandingPageProps) {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';

  return (
    <div className="relative min-h-screen w-full bg-[#0a0a0a] overflow-hidden flex items-center justify-center font-sans text-zinc-200">
      
      {/* Background Image */}
      <div className="absolute inset-0 z-0 bg-black">
        <motion.img 
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.6 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          src={bgImage} 
          alt="Background" 
          className="w-full h-full object-cover"
        />
        {/* Glow overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/20 to-black/60" />
      </div>

      {/* Top Right Logo */}
      <motion.div 
        className="absolute top-6 right-6 z-20"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <img src={logoImage} alt="Logo Right" className="h-16 md:h-20 object-contain drop-shadow-2xl" />
      </motion.div>

      {/* Top Left Logo */}
      <motion.div 
        className="absolute top-6 left-6 z-20"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <img src={leftLogoImage} alt="Logo Left" className="h-16 md:h-20 object-contain drop-shadow-2xl mix-blend-screen hover:scale-105 transition-transform" />
      </motion.div>

      {/* Main Content Area */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 max-w-5xl text-center">
        


        {/* Glassmorphism Container for Text Readability */}
        <motion.div 
          className="flex flex-col items-center p-8 md:p-12 rounded-3xl bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
        
        {/* Floating Icons */}
        <motion.div 
          className="flex gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="p-4 bg-emerald-950/50 rounded-2xl border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
            <Target className="w-8 h-8 text-emerald-400" />
          </div>
          <div className="p-4 bg-blue-950/50 rounded-2xl border border-blue-500/20 shadow-[0_0_30px_rgba(59,130,246,0.15)]">
            <Activity className="w-8 h-8 text-blue-400" />
          </div>
          <div className="p-4 bg-red-950/50 rounded-2xl border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1 
          className="text-5xl md:text-7xl font-black mb-6 tracking-tight text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
        >
          {t('title')}
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          className="text-lg md:text-2xl text-zinc-200 font-medium mb-12 max-w-2xl leading-relaxed drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          {t('landingDesc')}
        </motion.p>

        {/* 3D Interactive Start Button */}
        <motion.button
          onClick={onStart}
          whileHover={{ scale: 1.05, translateY: -5 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className={`relative group overflow-hidden rounded-full bg-emerald-500 px-12 py-5 text-xl font-black text-white shadow-[0_0_40px_rgba(16,185,129,0.5)] transition-all hover:shadow-[0_0_60px_rgba(16,185,129,0.8)] flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}
        >
          {/* Button Glow Effect */}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent group-hover:animate-shimmer" />
          
          <PlayCircle className="w-7 h-7" />
          <span>{t('startBtn')}</span>
        </motion.button>

        {/* Team Members */}
        <motion.div 
          className="flex flex-wrap justify-center gap-8 md:gap-12 mt-20 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          {teamMembers.map((member, idx) => (
            <div key={idx} className="flex flex-col items-center gap-3 group">
              <img 
                src={member.img} 
                alt={member.name} 
                className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-[3px] border-emerald-500/50 shadow-[0_0_25px_rgba(16,185,129,0.4)] group-hover:scale-110 group-hover:border-emerald-400 transition-transform duration-300"
              />
              <span className="text-sm md:text-base font-bold text-zinc-200 bg-black/60 px-4 py-1.5 rounded-lg backdrop-blur-md group-hover:text-emerald-400 transition-colors shadow-lg">
                {member.name}
              </span>
            </div>
          ))}
        </motion.div>
        
        </motion.div>
      </div>

    </div>
  );
}
