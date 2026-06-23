/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  Play, 
  Pause, 
  RotateCcw, 
  Sliders, 
  FileCheck, 
  Sparkles, 
  AlertCircle, 
  Terminal, 
  ToggleLeft, 
  Eye, 
  CheckCircle2,
  Trash2,
  FileVideo, Cpu, DownloadCloud, AlertTriangle, Maximize
} from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { MatchStatistics, TrackerEntity } from '../types';
import { mockTrackingTimeline } from '../mockData';

interface VideoSectionProps {
  isSimulator: boolean;
  apiEndpoint: string;
  onAnalysisSuccess: (stats: MatchStatistics, heatmaps: any) => void;
  isAnalyzing: boolean;
  setIsAnalyzing: (val: boolean) => void;
  selectedPlayerId: number | null;
}

export default function VideoSection({
  isSimulator,
  apiEndpoint,
  onAnalysisSuccess,
  isAnalyzing,
  setIsAnalyzing,
  selectedPlayerId
}: VideoSectionProps) {
  const { t } = useLanguage();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoURL, setVideoURL] = useState<string | null>(() => {
    return localStorage.getItem('football_video_url') || null;
  });
  const [dragActive, setDragActive] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisLogs, setAnalysisLogs] = useState<string[]>([]);
  const [isAnalyzed, setIsAnalyzed] = useState<boolean>(() => {
    return localStorage.getItem('football_is_analyzed') === 'true';
  });
  const [isPlaying, setIsPlaying] = useState(false);

  // Overlay Filters
  const [showBoxes, setShowBoxes] = useState(true);
  const [showPaths, setShowPaths] = useState(true);
  const [showSpeeds, setShowSpeeds] = useState(true);
  const [showBallTracker, setShowBallTracker] = useState(true);

  // Connection/Error states for external API
  const [apiError, setApiError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Log feed simulation text lists
  const loadingLogs = [
    "جاري الاتصال بقنوات الإدخال وتهيئة الذاكرة المؤقتة...",
    "تم الكشف عن ملف الفيديو بدقة 1080p بمعدل 60 إطار بالثانية...",
    "جاري تحميل خوارزمية ذكاء اللاعبين YOLOv10 (Sports Track Core)...",
    "تحديد الإحداثيات الأساسية وخطوط الملعب التكتيكية...",
    "جاري فرز ألوان الملابس الرياضية وتعيين الهويات للاعبي الفريق أ والفريق ب...",
    "تتبع مسار الكرة واستخراج السرعات والتبادلات بين اللاعبين...",
    "حساب الخرائط الحرارية لمناطق الضغط الدفاعي والهجومي...",
    "توليد مصفوفة الاستحواذ التراكمي وتدفق الهجمات التكتيكية...",
    "تمت المعالجة بنجاح! جاري دمج طبقات التحليلات الرياضية..."
  ];

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('video/')) {
        setVideoFile(file);
        setVideoURL(URL.createObjectURL(file));
        setApiError(null);
      } else {
        setApiError("عذراً، يرجى اختيار ملف فيديو صالح فقط.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVideoFile(file);
      setVideoURL(URL.createObjectURL(file));
      setApiError(null);
    }
  };

  const removeVideo = () => {
    setVideoFile(null);
    setVideoURL(null);
    setIsAnalyzed(false);
    setIsPlaying(false);
    setAnalysisProgress(0);
    setAnalysisLogs([]);
    setApiError(null);
    localStorage.removeItem('football_video_url');
    localStorage.removeItem('football_is_analyzed');
    localStorage.removeItem('football_stats');
    localStorage.removeItem('football_heatmaps');
    // Call the success callback with empty data to reset App state
    onAnalysisSuccess(
      { teamA: { possession: 0, passes: 0, passAccuracy: 0, avgSpeed: 0, distanceCovered: 0, shotsOnTarget: 0, fouls: 0, yellowCards: 0 }, teamB: { possession: 0, passes: 0, passAccuracy: 0, avgSpeed: 0, distanceCovered: 0, shotsOnTarget: 0, fouls: 0, yellowCards: 0 }, players: [] },
      { teamA: [], teamB: [], ball: [] }
    );
  };

  // Click start analysis
  const startAnalysis = async () => {
    if (!videoFile) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setAnalysisLogs([]);
    setApiError(null);

    if (isSimulator) {
      // Simulate real-time progress & terminal feeds
      let progress = 0;
      let logIndex = 0;

      const interval = setInterval(() => {
        progress += 4;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setTimeout(() => {
            setIsAnalyzing(false);
            setIsAnalyzed(true);
            // Trigger stats callback with mock analytics
            onAnalysisSuccess({
              teamA: {
                possession: 58,
                passes: 442,
                passAccuracy: 88,
                avgSpeed: 24.1,
                distanceCovered: 109.8,
                shotsOnTarget: 8,
                fouls: 10,
                yellowCards: 1
              },
              teamB: {
                possession: 42,
                passes: 310,
                passAccuracy: 76,
                avgSpeed: 21.4,
                distanceCovered: 104.3,
                shotsOnTarget: 3,
                fouls: 15,
                yellowCards: 4
              },
              players: [
                { id: 1, number: 10, name: "يوسف الأنصاري", team: 'A', speed: 35.8, distance: 11.4, position: "مهاجم صريح" },
                { id: 2, number: 7, name: "عمر الحربي", team: 'A', speed: 33.5, distance: 10.9, position: "جناح أيمن" },
                { id: 3, number: 8, name: "خالد الدوسري", team: 'A', speed: 29.4, distance: 12.4, position: "صانع ألعاب" },
                { id: 4, number: 9, name: "كريم السعيد", team: 'B', speed: 32.8, distance: 10.1, position: "مهاجم" },
                { id: 5, number: 4, name: "أحمد المولد", team: 'B', speed: 30.2, distance: 9.5, position: "مدافع قلب" },
                { id: 6, number: 6, name: "فيصل العتيبي", team: 'A', speed: 28.7, distance: 11.8, position: "وسط مدافع" },
                { id: 7, number: 11, name: "فهد المري", team: 'B', speed: 33.1, distance: 10.3, position: "جناح أيسر" }
              ]
            }, { teamA: [], teamB: [], ball: [] });
          }, 600);
        }

        // Push logs dynamically matching progress percentage
        const expectedLogIndex = Math.floor((progress / 100) * loadingLogs.length);
        if (expectedLogIndex > logIndex && logIndex < loadingLogs.length) {
          setAnalysisLogs(prev => [...prev, loadingLogs[logIndex]]);
          logIndex = expectedLogIndex;
        }

        setAnalysisProgress(progress);
      }, 100);

    } else {
      // Real API Upload via FormData
      setAnalysisLogs(["جاري تهيئة الاتصال بالسيرفر الخارجي...", `POST ${apiEndpoint}...`]);
      setAnalysisProgress(15);

      try {
        const formData = new FormData();
        formData.append('file', videoFile); // Backend expects 'file'

        const response = await fetch(apiEndpoint, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`استجابة السيرفر غير موافقة: ${response.status}`);
        }

        const data = await response.json();
        
        const videoServerUrl = new URL(apiEndpoint).origin; // Extract http://127.0.0.1:8000
        const newVideoUrl = `${videoServerUrl}/video/${data.video_id}`;
        setVideoURL(newVideoUrl);
        localStorage.setItem('football_video_url', newVideoUrl);

        setAnalysisProgress(100);
        setAnalysisLogs(prev => [...prev, "✓ تم استلام الإحصائيات والفيديو من السيرفر!"]);

        setTimeout(() => {
          setIsAnalyzing(false);
          setIsAnalyzed(true);
          localStorage.setItem('football_is_analyzed', 'true');
          onAnalysisSuccess(data.statistics, data.heatmaps);
        }, 500);

      } catch (err: any) {
        console.error(err);
        setIsAnalyzing(false);
        setApiError(
          `فشل بالاتصال بنقطة النهاية المطلوبة (${apiEndpoint}). السيرفر المحلي قد يكون غير مفعل. تأكد من تشغيل الباكيند وتخطي حماية الاتصال (CORS)، أو قم بالتبديل إلى "المحاكي المدمج التفاعلي" من الشريط العلوي للتجربة الفورية.`
        );
      }
    }
  };

  const loadLatestAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(50);
    setAnalysisLogs(["جاري جلب آخر تحليل من السيرفر..."]);
    setApiError(null);

    try {
      const serverUrl = new URL(apiEndpoint).origin;
      const latestEndpoint = `${serverUrl}/latest`;
      const response = await fetch(latestEndpoint);

      if (!response.ok) {
        throw new Error("لا يوجد تحليل سابق متاح على السيرفر.");
      }

      const data = await response.json();
      
      const newVideoUrl = `${serverUrl}/video/${data.video_id}`;
      setVideoURL(newVideoUrl);
      localStorage.setItem('football_video_url', newVideoUrl);

      setAnalysisProgress(100);
      setAnalysisLogs(prev => [...prev, "✓ تم استرجاع آخر إحصائيات بنجاح!"]);

      setTimeout(() => {
        setIsAnalyzing(false);
        setIsAnalyzed(true);
        localStorage.setItem('football_is_analyzed', 'true');
        onAnalysisSuccess(data.statistics, data.heatmaps);
      }, 500);

    } catch (err: any) {
      console.error(err);
      setIsAnalyzing(false);
      setApiError(err.message || "فشل في استرجاع التحليل السابق.");
    }
  };

  // Removed the mock canvas drawing loop overlay since the backend model handles rendering boxes onto the video

  return (
    <div className="flex-1 flex flex-col bg-[#141414] p-5 rounded-2xl border border-emerald-900/30 shadow-xl shadow-black/40">
      
      {/* Upper options with statistics controls */}
      <div className="flex items-center justify-between gap-2 border-b border-emerald-900/20 pb-3.5 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-900/40">
            <Eye className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-gray-100 font-sans">{t('videoTitle')}</h2>
        </div>

        {isAnalyzed && (
          <div className="flex flex-wrap items-center gap-1.5 bg-black/40 p-1 rounded-lg border border-emerald-900/15 animate-fadeIn">
            <button
              onClick={() => setShowBoxes(!showBoxes)}
              className={`text-[10px] px-2.5 py-1 rounded transition-colors ${showBoxes ? 'bg-emerald-600 text-black font-bold' : 'text-gray-400 hover:text-white'}`}
            >
              {t('yoloBoxes')}
            </button>
            <button
              onClick={() => setShowPaths(!showPaths)}
              className={`text-[10px] px-2.5 py-1 rounded transition-colors ${showPaths ? 'bg-emerald-600 text-black font-bold' : 'text-gray-400 hover:text-white'}`}
            >
              {t('speedVectors')}
            </button>
            <button
              onClick={() => setShowSpeeds(!showSpeeds)}
              className={`text-[10px] px-2.5 py-1 rounded transition-colors ${showSpeeds ? 'bg-emerald-600 text-black font-bold' : 'text-gray-400 hover:text-white'}`}
            >
              {t('speedData')}
            </button>
            <button
              onClick={() => setShowBallTracker(!showBallTracker)}
              className={`text-[10px] px-2.5 py-1 rounded transition-colors ${showBallTracker ? 'bg-emerald-600 text-black font-bold' : 'text-gray-400 hover:text-white'}`}
            >
              {t('ballTracker')}
            </button>
          </div>
        )}
      </div>

      {/* ERROR SECTION */}
      {apiError && (
        <div className="mb-4 p-4 bg-red-950/25 border border-red-900/30 rounded-xl text-xs text-red-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-red-400">فشل في الاتصال بموديل التحليل الخارجي</h4>
            <p className="mt-1 leading-relaxed text-gray-350">{apiError}</p>
          </div>
        </div>
      )}

      {/* RENDER ACTIVE Uploader / Simulator Engine */}
      {!isAnalyzed ? (
        <div className="flex-1 flex flex-col justify-center">
          
          {/* UPLOAD DRAG AREA */}
          {!isAnalyzing ? (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
                dragActive 
                  ? 'border-emerald-500 bg-emerald-500/5 scale-[0.99]' 
                  : 'border-emerald-900/30 bg-black/20 hover:border-emerald-500/40 hover:bg-black/35'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="video/*"
                onChange={handleFileChange}
              />
              <div className="p-4 bg-black/40 rounded-2xl text-emerald-400 border border-emerald-900/20 mb-4 shadow-xl">
                <UploadCloud className="w-7 h-7" />
              </div>
              <h3 className="text-gray-250 text-sm font-bold font-sans">
                {videoFile ? t('videoUploadedSuccess') : t('dragDropMatchVideo')}
              </h3>
              <p className="text-xs text-gray-400 mt-1.5 max-w-sm">
                {videoFile ? `${videoFile.name} (${(videoFile.size / (1024 * 1024)).toFixed(1)} MB)` : t('browseLocalFiles')}
              </p>
              
              {videoFile && (
                <div className="mt-3 text-[10px] text-emerald-400 flex items-center gap-1 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-900/40 font-medium">
                  <FileCheck className="w-3 h-3" />
                  {t('fileReadyForAnalysis')}
                </div>
              )}
            </div>
          ) : (
            // PROGRESS BAR ANALYSIS SCREEN
            <div className="p-6 bg-black/30 border border-emerald-900/20 rounded-2xl flex flex-col items-center justify-center space-y-6">
              
              {/* Spinning visual core */}
              <div className="relative flex items-center justify-center w-16 h-16">
                <div className="absolute inset-0 border-4 border-emerald-900/10 rounded-full" />
                <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
              </div>

              {/* Status display */}
              <div className="text-center">
                <span className="text-xs text-emerald-500 font-mono tracking-wider">TENSOR MULTIPROCESSOR ACTIVATED</span>
                <h3 className="text-sm font-bold text-gray-200 mt-1">جاري معالجة إطارات الفيديو وتتبع الكائنات...</h3>
                <div className="text-2xl font-black font-mono text-emerald-400 mt-2">{analysisProgress}%</div>
              </div>

              {/* Simple progress track */}
              <div className="w-full max-w-md h-1.5 bg-gray-950 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${analysisProgress}%` }}
                />
              </div>

              {/* Simulation logs console terminal */}
              <div className="w-full max-w-lg bg-black/90 rounded-lg p-3 text-right text-[10px] font-mono leading-relaxed h-32 overflow-y-auto space-y-1 block border border-emerald-900/20 custom-scrollbar">
                <div className="text-emerald-500 flex items-center gap-1.5 mb-1 text-[9px] uppercase tracking-wider border-b border-emerald-900/20 pb-1 shrink-0">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>لوحة سجلات معالج الذكاء الاصطناعي (AI Core Logs)</span>
                </div>
                {analysisLogs.map((log, index) => (
                  <div key={index} className="text-gray-400 font-medium animate-fadeIn">
                    <span className="text-gray-500 ml-1">[{index + 1}]</span> {log}
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* ANALYSIS BUTTON */}
          {videoFile && !isAnalyzing && (
            <button
              onClick={startAnalysis}
              className="mt-4 w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-sm rounded-xl transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-black" />
              {t('analyzeWithSmartModel')}
            </button>
          )}

          {/* RESTORE LATEST BUTTON */}
          {!videoFile && !isAnalyzing && (
            <button
              onClick={loadLatestAnalysis}
              className="mt-4 w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-bold text-sm rounded-xl transition-all duration-300 shadow flex items-center justify-center gap-2 border border-emerald-900/30"
            >
              <RotateCcw className="w-4 h-4" />
              {t('restoreAnalysisServer')}
            </button>
          )}

        </div>
      ) : (
        
        /* AFTER ANALYSIS COMPLETE: SHOW GAME MULTI-OBJECT DETECTOR VIDEO PLAYER */
        <div className="flex-1 flex flex-col space-y-4">
          
          <div ref={containerRef} className="relative w-full aspect-[16/9] bg-black rounded-xl overflow-hidden border border-emerald-900/20 group shadow-2xl">
            


            {/* Simulated standard HTML5 player */}
            {videoURL && (
              <video
                ref={videoRef}
                src={videoURL}
                className="w-full h-full object-cover"
                loop
                muted
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            )}

            {/* Click to Play layer */}
            {!isPlaying && (
              <div 
                onClick={() => videoRef.current?.play()}
                className="absolute inset-0 bg-black/40 flex items-center justify-center z-20 cursor-pointer animate-fadeIn"
              >
                <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center shadow-lg text-black scale-100 hover:scale-105 transition-transform duration-200">
                  <Play className="w-5 h-5 fill-current text-black mr-0.5" />
                </div>
              </div>
            )}

            {/* Float HUD banner details */}
            <div className="absolute top-3 right-3 bg-black/85 rounded-lg px-2.5 py-1 z-20 border border-emerald-900/30 text-[10px] text-gray-300 font-mono flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
              <span>YOLOv10 Sports Tracking HUD</span>
            </div>

          </div>

          {/* Transport/Video controllers */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/30 p-3 rounded-xl border border-emerald-900/20">
            <div className="flex items-center gap-2">
              {isPlaying ? (
                <button
                  onClick={() => videoRef.current?.pause()}
                  className="px-4 py-2 bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-900/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <Pause className="w-3.5 h-3.5 text-emerald-400" />
                  {t('pause')}
                </button>
              ) : (
                <button
                  onClick={() => videoRef.current?.play()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-black rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-black text-black" />
                  {t('playStream')}
                </button>
              )}

              <button
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                    videoRef.current.play();
                  }
                }}
                className="p-2 bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-900/10 text-emerald-400 rounded-lg text-xs transition-colors"
                title="إعادة التشغيل"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={toggleFullscreen}
                className="p-2 bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-900/10 text-emerald-400 rounded-lg text-xs transition-colors"
                title={t('fullScreen')}
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="text-right">
                <span className="text-[10px] text-gray-500 block">{t('processedFile')}</span>
                <span className="text-xs text-gray-300 font-semibold truncate max-w-sm block">
                  {videoFile?.name || "match_analysis_sequence.mp4"}
                </span>
              </div>

              <button
                onClick={removeVideo}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                title="إلغاء الفيديو وبدء جديد"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
