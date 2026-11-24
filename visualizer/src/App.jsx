import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Play, Pause, RotateCcw, Download, Film, Volume2, VolumeX,
  Sliders, Music, Disc3, Sparkles, Activity, Layers, Maximize2,
  ChevronRight, CheckCircle2, SlidersHorizontal, ArrowUpRight,
  Upload, Radio, BarChart3, Sun, Waves, RefreshCw, ChevronDown, Check, Type
} from 'lucide-react';
import ysFixWebmDuration from 'fix-webm-duration';

const FONT_OPTIONS = [
  { id: 'great-vibes', label: 'Great Vibes (Script Signature)', family: '"Great Vibes", cursive', style: 'Script' },
  { id: 'alex-brush', label: 'Alex Brush (Calligraphic Script)', family: '"Alex Brush", cursive', style: 'Script' },
  { id: 'cormorant', label: 'Cormorant Garamond (Editorial Luxury)', family: '"Cormorant Garamond", serif', style: 'Serif' },
  { id: 'cinzel', label: 'Cinzel Classical (Cinematic Roman)', family: '"Cinzel", serif', style: 'Serif' },
  { id: 'syne', label: 'Syne (Sculpted Modernist)', family: '"Syne", sans-serif', style: 'Display' },
  { id: 'outfit', label: 'Outfit (Clean Neo-Grotesque)', family: '"Outfit", sans-serif', style: 'Sans' },
  { id: 'plus-jakarta', label: 'Plus Jakarta Sans (Technical Minimal)', family: '"Plus Jakarta Sans", sans-serif', style: 'Sans' }
];

// Preset color themes complying with non-slop restrained mineral palettes
const COLOR_THEMES = [
  {
    id: 'sapphire-gold',
    name: 'Sapphire & Gold',
    badge: '#d4a23b',
    primary: '#38bdf8',
    secondary: '#d4a23b',
    ambient: 'rgba(217, 169, 74, 0.05)',
    bgStops: ['#0a1840', '#050c20', '#02050e'],
    barGrad: ['#fef08a', '#d4a23b', '#38bdf8', '#4f46e5', '#1e1b4b'],
    glow: '#d4a23b'
  },
  {
    id: 'smoky-amber',
    name: 'Smoky Amber & Obsidian',
    badge: '#f59e0b',
    primary: '#f97316',
    secondary: '#fbbf24',
    ambient: 'rgba(245, 158, 11, 0.055)',
    bgStops: ['#231206', '#140a04', '#060301'],
    barGrad: ['#fef3c7', '#fbbf24', '#ea580c', '#7c2d12', '#260d05'],
    glow: '#f59e0b'
  },
  {
    id: 'verdant-emerald',
    name: 'Mineral Emerald & Sage',
    badge: '#34d399',
    primary: '#10b981',
    secondary: '#059669',
    ambient: 'rgba(52, 211, 153, 0.045)',
    bgStops: ['#062319', '#03140e', '#010805'],
    barGrad: ['#d1fae5', '#34d399', '#059669', '#047857', '#022c22'],
    glow: '#34d399'
  },
  {
    id: 'graphite-monochrome',
    name: 'Studio Graphite & Silver',
    badge: '#e2e8f0',
    primary: '#94a3b8',
    secondary: '#cbd5e1',
    ambient: 'rgba(226, 232, 240, 0.04)',
    bgStops: ['#1e293b', '#0f172a', '#020617'],
    barGrad: ['#ffffff', '#cbd5e1', '#64748b', '#334155', '#0f172a'],
    glow: '#ffffff'
  }
];

export default function App() {
  // Track metadata
  const [trackTitle, setTrackTitle] = useState('Debut Track');
  const [artistName, setArtistName] = useState('Composer');
  const [subBadge, setSubBadge] = useState('DEBUT COMPOSITION');

  // Custom audio source support
  const [audioSource, setAudioSource] = useState('/audio.wav');
  const [audioFileName, setAudioFileName] = useState('Project_1.wav');

  // Visualizer styling & modes
  const [visualMode, setVisualMode] = useState('wavebars'); // 'wavebars' | 'mirror' | 'solar'
  const [currentThemeId, setCurrentThemeId] = useState('sapphire-gold');
  const [fontFamily, setFontFamily] = useState('great-vibes'); // default elegant script
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  const [titleSize, setTitleSize] = useState(54);
  const [artistSize, setArtistSize] = useState(38);
  const [barCount, setBarCount] = useState(64);
  const [glowIntensity, setGlowIntensity] = useState(14);
  const [barSensitivity, setBarSensitivity] = useState(250);
  const [showVignette, setShowVignette] = useState(true);

  // Playback & Export state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);
  const [recordedMimeType, setRecordedMimeType] = useState('video/mp4');
  const [recordProgress, setRecordProgress] = useState(0);

  // Peak history for smooth decay & studio metering
  const peakHistoryRef = useRef(new Float32Array(128).fill(0));

  // Refs
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const animFrameIdRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const fileInputRef = useRef(null);

  const activeTheme = COLOR_THEMES.find(t => t.id === currentThemeId) || COLOR_THEMES[0];

  // Setup Web Audio Context on user action
  const setupAudioContext = useCallback(() => {
    if (!audioContextRef.current && audioRef.current) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.82;

      const source = ctx.createMediaElementSource(audioRef.current);
      source.connect(analyser);
      analyser.connect(ctx.destination);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      sourceNodeRef.current = source;
    }
  }, []);

  // Main Render Loop: 16:9 Sculpted Stage
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // 1. Architectured Background Ground
    const bgGrad = ctx.createRadialGradient(
      width / 2, height * 0.46, 120,
      width / 2, height * 0.5, width * 0.78
    );
    bgGrad.addColorStop(0, activeTheme.bgStops[0]);
    bgGrad.addColorStop(0.5, activeTheme.bgStops[1]);
    bgGrad.addColorStop(1, activeTheme.bgStops[2]);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle ambient core light
    const ambientGrad = ctx.createRadialGradient(
      width / 2, height * 0.62, 10,
      width / 2, height * 0.62, 420
    );
    ambientGrad.addColorStop(0, activeTheme.ambient);
    ambientGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = ambientGrad;
    ctx.fillRect(0, 0, width, height);

    // Architectural perimeter vignette
    if (showVignette) {
      const vignette = ctx.createRadialGradient(width / 2, height / 2, height * 0.42, width / 2, height / 2, width * 0.72);
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(1, 3, 10, 0.78)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Fetch Frequency Spectrum
    let freqData = new Uint8Array(256);
    if (analyserRef.current) {
      analyserRef.current.getByteFrequencyData(freqData);
    }

    // 3. Render Mode Selection
    if (visualMode === 'wavebars') {
      // Architectural Wavebars
      const count = barCount;
      const barZoneWidth = width * 0.68;
      const spacing = 4;
      const barWidth = (barZoneWidth - (count * spacing)) / count;
      const startX = (width - barZoneWidth) / 2;
      const centerY = height * 0.64;

      // Subtle horizon baseline
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(startX - 30, centerY);
      ctx.lineTo(startX + barZoneWidth + 30, centerY);
      ctx.stroke();
      ctx.restore();

      for (let i = 0; i < count; i++) {
        const freqIndex = Math.floor(Math.pow(i / count, 1.22) * (freqData.length * 0.75));
        const rawVal = freqData[freqIndex] || 0;
        
        // Smooth peak decay
        const prevPeak = peakHistoryRef.current[i] || 0;
        const currentTarget = Math.max(5, (rawVal / 255) * barSensitivity);
        const smoothHeight = currentTarget > prevPeak ? currentTarget : prevPeak * 0.94;
        peakHistoryRef.current[i] = smoothHeight;

        const x = startX + i * (barWidth + spacing);

        const barGrad = ctx.createLinearGradient(0, centerY - smoothHeight, 0, centerY + smoothHeight);
        barGrad.addColorStop(0, activeTheme.barGrad[0]);
        barGrad.addColorStop(0.25, activeTheme.barGrad[1]);
        barGrad.addColorStop(0.5, activeTheme.barGrad[2]);
        barGrad.addColorStop(0.78, activeTheme.barGrad[3]);
        barGrad.addColorStop(1, activeTheme.barGrad[4]);

        ctx.save();
        ctx.shadowBlur = glowIntensity;
        ctx.shadowColor = (i % 2 === 0) ? activeTheme.glow : activeTheme.primary;
        ctx.fillStyle = barGrad;

        ctx.beginPath();
        ctx.roundRect(x, centerY - smoothHeight, barWidth, smoothHeight * 2, barWidth / 2);
        ctx.fill();
        ctx.restore();
      }
    } else if (visualMode === 'mirror') {
      // Horizon Reflective Mirror (Upper bars with softer watery bottom reflection)
      const count = barCount;
      const barZoneWidth = width * 0.70;
      const spacing = 4;
      const barWidth = (barZoneWidth - (count * spacing)) / count;
      const startX = (width - barZoneWidth) / 2;
      const baselineY = height * 0.66;

      // Fine etched horizon line
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(startX - 20, baselineY);
      ctx.lineTo(startX + barZoneWidth + 20, baselineY);
      ctx.stroke();
      ctx.restore();

      for (let i = 0; i < count; i++) {
        const freqIndex = Math.floor(Math.pow(i / count, 1.25) * (freqData.length * 0.75));
        const rawVal = freqData[freqIndex] || 0;
        const barHeight = Math.max(4, (rawVal / 255) * barSensitivity * 1.1);
        const x = startX + i * (barWidth + spacing);

        // Upper bar
        const upGrad = ctx.createLinearGradient(0, baselineY - barHeight, 0, baselineY);
        upGrad.addColorStop(0, activeTheme.barGrad[0]);
        upGrad.addColorStop(0.4, activeTheme.barGrad[1]);
        upGrad.addColorStop(1, activeTheme.barGrad[2]);

        ctx.save();
        ctx.shadowBlur = glowIntensity;
        ctx.shadowColor = activeTheme.glow;
        ctx.fillStyle = upGrad;
        ctx.beginPath();
        ctx.roundRect(x, baselineY - barHeight, barWidth, barHeight, [barWidth / 2, barWidth / 2, 0, 0]);
        ctx.fill();
        ctx.restore();

        // Lower reflection (attenuated & diffused)
        const reflectHeight = barHeight * 0.55;
        const downGrad = ctx.createLinearGradient(0, baselineY, 0, baselineY + reflectHeight);
        downGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
        downGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.15)');
        downGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = downGrad;
        ctx.beginPath();
        ctx.roundRect(x, baselineY + 2, barWidth, reflectHeight, [0, 0, barWidth / 2, barWidth / 2]);
        ctx.fill();
      }
    } else if (visualMode === 'solar') {
      // Radial Solar Core (Circular pulse suitable for album arts)
      const centerX = width / 2;
      const centerY = height * 0.61;
      const baseRadius = 88;
      const count = Math.min(barCount, 64);

      // Core disc
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, baseRadius - 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(5, 12, 32, 0.9)';
      ctx.strokeStyle = activeTheme.badge;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = glowIntensity;
      ctx.shadowColor = activeTheme.glow;
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
        const freqIndex = Math.floor(Math.pow(i / count, 1.1) * (freqData.length * 0.7));
        const val = freqData[freqIndex] || 0;
        const rayLen = Math.max(6, (val / 255) * (barSensitivity * 0.55));

        const x1 = centerX + Math.cos(angle) * baseRadius;
        const y1 = centerY + Math.sin(angle) * baseRadius;
        const x2 = centerX + Math.cos(angle) * (baseRadius + rayLen);
        const y2 = centerY + Math.sin(angle) * (baseRadius + rayLen);

        ctx.save();
        ctx.strokeStyle = (i % 2 === 0) ? activeTheme.barGrad[0] : activeTheme.barGrad[2];
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.shadowBlur = glowIntensity * 0.7;
        ctx.shadowColor = activeTheme.glow;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 4. ARCHITECTURAL TYPOGRAPHY (Editorial hierarchy, customizable high-craft typography)
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Font mapping
    let fontName = '"Plus Jakarta Sans", sans-serif';
    let artistFontName = '"Great Vibes", cursive';
    let isItalicArtist = false;
    let titleLetterSpacing = '-0.5px';
    let artistLetterSpacing = '1px';

    if (fontFamily === 'great-vibes') {
      fontName = '"Cinzel", serif';
      artistFontName = '"Great Vibes", cursive';
      titleLetterSpacing = '3px';
      artistLetterSpacing = '2px';
    } else if (fontFamily === 'alex-brush') {
      fontName = '"Outfit", sans-serif';
      artistFontName = '"Alex Brush", cursive';
      titleLetterSpacing = '1px';
      artistLetterSpacing = '2px';
    } else if (fontFamily === 'cinzel') {
      fontName = '"Cinzel", serif';
      artistFontName = '"Cinzel", serif';
      titleLetterSpacing = '3px';
      artistLetterSpacing = '2px';
    } else if (fontFamily === 'cormorant') {
      fontName = '"Cormorant Garamond", serif';
      artistFontName = '"Cormorant Garamond", serif';
      isItalicArtist = true;
      titleLetterSpacing = '2px';
      artistLetterSpacing = '1.5px';
    } else if (fontFamily === 'syne') {
      fontName = '"Syne", sans-serif';
      artistFontName = '"Outfit", sans-serif';
      titleLetterSpacing = '-0.5px';
      artistLetterSpacing = '1.5px';
    } else if (fontFamily === 'outfit') {
      fontName = '"Outfit", sans-serif';
      artistFontName = '"Outfit", sans-serif';
      titleLetterSpacing = '0px';
      artistLetterSpacing = '1.5px';
    } else {
      fontName = '"Plus Jakarta Sans", sans-serif';
      artistFontName = '"Plus Jakarta Sans", sans-serif';
      titleLetterSpacing = '-0.5px';
      artistLetterSpacing = '1px';
    }

    // Subtitle Eyebrow (Letter-spaced micro-typography)
    ctx.font = `600 13px ${fontName}`;
    ctx.fillStyle = activeTheme.badge;
    ctx.letterSpacing = '6px';
    ctx.fillText(subBadge.toUpperCase(), width / 2, height * 0.19);

    // Track Title (Commanding title)
    ctx.font = `700 ${titleSize}px ${fontName}`;
    ctx.fillStyle = '#ffffff';
    ctx.letterSpacing = titleLetterSpacing;
    ctx.fillText(trackTitle, width / 2, height * 0.27);

    // Composer / Artist (Prominent, stylized script / editorial serif / sans)
    ctx.font = `${isItalicArtist ? 'italic ' : ''}500 ${artistSize}px ${artistFontName}`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.90)';
    ctx.letterSpacing = artistLetterSpacing;
    ctx.fillText(artistName, width / 2, height * 0.35);

    animFrameIdRef.current = requestAnimationFrame(renderCanvas);
  }, [trackTitle, artistName, subBadge, barCount, glowIntensity, barSensitivity, visualMode, activeTheme, showVignette, fontFamily, titleSize, artistSize]);

  useEffect(() => {
    renderCanvas();
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [renderCanvas]);

  // Audio Playback
  const togglePlay = async () => {
    setupAudioContext();
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
  };

  const handleAudioTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (duration > 0 && isRecording) {
        setRecordProgress((audioRef.current.currentTime / duration) * 100);
      }
    }
  };

  const restartAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleVolumeChange = (newVol) => {
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
    if (newVol > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  // Custom audio file upload handler
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioSource(url);
      setAudioFileName(file.name);
      // Auto infer title if user wants
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
      setTrackTitle(nameWithoutExt);
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  // Video Recording for X (High Profile 60fps canvas + stereo audio stream)
  const startRecording = async () => {
    setupAudioContext();
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    const canvas = canvasRef.current;
    const audio = audioRef.current;
    if (!canvas || !audio) return;

    recordedChunksRef.current = [];
    setRecordedVideoUrl(null);
    setIsRecording(true);
    setRecordProgress(0);

    audio.currentTime = 0;

    const canvasStream = canvas.captureStream(60);
    const dest = audioContextRef.current.createMediaStreamDestination();
    sourceNodeRef.current.connect(dest);

    const combinedStream = new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...dest.stream.getAudioTracks()
    ]);

    // Use WebM with VP9/H.264 for universal capture
    let chosenMime = 'video/webm;codecs=vp9,opus';
    const candidateMimes = [
      'video/webm;codecs=h264,opus',
      'video/webm;codecs=vp9,opus',
      'video/webm'
    ];

    for (const mime of candidateMimes) {
      if (MediaRecorder.isTypeSupported(mime)) {
        chosenMime = mime;
        break;
      }
    }

    setRecordedMimeType('video/webm');

    const recorder = new MediaRecorder(combinedStream, {
      mimeType: chosenMime,
      videoBitsPerSecond: 14000000 // 14Mbps high bitrate
    });
    mediaRecorderRef.current = recorder;

    const recordStartTime = Date.now();

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      const rawBlob = new Blob(recordedChunksRef.current, { type: chosenMime });
      const totalDurationMs = Math.max(1000, (duration || (Date.now() - recordStartTime) / 1000) * 1000);

      // Fix EBML headers so phones & players have the true seek duration
      ysFixWebmDuration(rawBlob, totalDurationMs, (fixedBlob) => {
        const url = URL.createObjectURL(fixedBlob);
        setRecordedVideoUrl(url);
        setIsRecording(false);
        setIsPlaying(false);
      });
    };

    // Setup Web Audio Context on user action
    // In Chromium / Safari / Mobile browsers, MediaRecorder captures dynamically until stopped.
    // To ensure files have proper seek headers, start with 1000ms chunks to flush container timestamps
    recorder.start(1000);
    audio.play();
    setIsPlaying(true);

    audio.onended = () => {
      if (recorder.state === 'recording') {
        recorder.stop();
      }
      setIsPlaying(false);
    };
  };

  return (
    <div className="min-h-screen bg-[#030712] text-neutral-100 flex flex-col font-sans selection:bg-amber-500 selection:text-neutral-950">
      {/* 
        STUDIO NAVBAR (Non-slop: architectural, monochromatic real vectors, honest telemetry)
      */}
      <header className="border-b border-white/[0.07] bg-[#050c1f]/85 backdrop-blur-2xl sticky top-0 z-30 px-6 lg:px-12 py-3.5">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          {/* Identity */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 via-sky-400 to-indigo-600 p-[1px]">
              <div className="w-full h-full bg-[#050c1f] rounded-[7px] flex items-center justify-center">
                <Activity className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold tracking-tight text-white">Wavelight Studio</span>
              <span className="text-[10px] text-neutral-400 font-mono tracking-wider">v2.0</span>
            </div>
          </div>

          {/* Studio Telemetry */}
          <div className="hidden md:flex items-center gap-6 text-xs text-neutral-400 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-neutral-500">FORMAT</span>
              <span className="text-neutral-200">1920×1080 (16:9 60FPS)</span>
            </div>
            <div className="h-3 w-[1px] bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-neutral-500">SOURCE</span>
              <span className="text-neutral-200 truncate max-w-[140px]">{audioFileName}</span>
            </div>
            <div className="h-3 w-[1px] bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="text-neutral-500">THEME</span>
              <span className="text-neutral-200">{activeTheme.name}</span>
            </div>
          </div>

          {/* Actions & Export */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.08] text-neutral-300 text-xs font-medium transition active:scale-95"
              title="Upload your own audio file"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Change Audio</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            {recordedVideoUrl ? (
              <div className="flex items-center gap-2">
                <a
                  href={recordedVideoUrl}
                  download={`${trackTitle.replace(/\s+/g, '_')}_1080p.webm`}
                  className="flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-neutral-950 px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition active:scale-95 shadow-lg shadow-amber-500/20"
                >
                  <Download className="w-3.5 h-3.5 stroke-[2.2]" />
                  <span>Download Fixed 1080p Video</span>
                </a>
                <button
                  onClick={() => setRecordedVideoUrl(null)}
                  className="p-1.5 rounded-lg border border-white/[0.08] hover:bg-white/[0.06] text-neutral-400 hover:text-white transition text-xs"
                  title="Discard and record again"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={startRecording}
                disabled={isRecording}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition ${
                  isRecording
                    ? 'bg-rose-500/15 border border-rose-500/40 text-rose-300 animate-pulse'
                    : 'bg-white hover:bg-neutral-200 text-neutral-950 active:scale-95 shadow-sm'
                }`}
              >
                <Film className="w-3.5 h-3.5 stroke-[2]" />
                <span>{isRecording ? `Recording (${recordProgress.toFixed(0)}%)...` : 'Record Video'}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 
        MAIN WORKSPACE
        - Left: 16:9 Canvas Stage with Architectural Precision Chamfer
        - Right: Studio Control Deck
      */}
      <main className="flex-1 flex flex-col lg:flex-row p-6 lg:p-10 gap-8 max-w-[1600px] mx-auto w-full items-start justify-center">
        {/* Canvas Display Stage */}
        <div className="flex-1 flex flex-col w-full min-w-0 gap-4">
          <div className="relative w-full rounded-2xl overflow-hidden border border-white/[0.08] shadow-[0_30px_90px_-20px_rgba(0,0,0,0.95)] aspect-video bg-[#02050e] ring-1 ring-white/[0.04] group">
            <canvas
              ref={canvasRef}
              width={1920}
              height={1080}
              className="w-full h-full object-contain block"
            />

            {/* In-canvas Recording State Indicator */}
            {isRecording && (
              <div className="absolute top-5 right-5 flex items-center gap-2 bg-neutral-950/85 backdrop-blur-md border border-rose-500/40 px-3.5 py-1.5 rounded-full text-xs font-mono text-rose-300">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>REC 60FPS</span>
              </div>
            )}

            {/* Canvas Quick Switch Bar on bottom overlay */}
            <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-none">
              <div className="pointer-events-auto flex items-center gap-1.5 p-1 rounded-xl bg-neutral-950/80 backdrop-blur-md border border-white/[0.08] text-xs">
                <button
                  onClick={() => setVisualMode('wavebars')}
                  className={`px-3 py-1 rounded-lg transition ${visualMode === 'wavebars' ? 'bg-white/15 text-white font-medium' : 'text-neutral-400 hover:text-white'}`}
                >
                  Wavebars
                </button>
                <button
                  onClick={() => setVisualMode('mirror')}
                  className={`px-3 py-1 rounded-lg transition ${visualMode === 'mirror' ? 'bg-white/15 text-white font-medium' : 'text-neutral-400 hover:text-white'}`}
                >
                  Mirror Horizon
                </button>
                <button
                  onClick={() => setVisualMode('solar')}
                  className={`px-3 py-1 rounded-lg transition ${visualMode === 'solar' ? 'bg-white/15 text-white font-medium' : 'text-neutral-400 hover:text-white'}`}
                >
                  Solar Iris
                </button>
              </div>

              <div className="pointer-events-auto flex items-center gap-2 p-1 px-3 rounded-xl bg-neutral-950/80 backdrop-blur-md border border-white/[0.08] text-xs text-neutral-300 font-mono">
                <span>1080p HD</span>
              </div>
            </div>
          </div>

          {/* Stage Under-Bar: Playback Scrubber & Volume HUD */}
          <div className="architectural-panel p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={togglePlay}
                className="py-2 px-5 rounded-lg bg-white hover:bg-neutral-200 text-neutral-950 font-medium text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition active:scale-95 shadow-sm"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    <span>Play Audio</span>
                  </>
                )}
              </button>

              <button
                onClick={restartAudio}
                className="p-2 rounded-lg border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-neutral-300 transition"
                title="Restart"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Volume & Mute */}
              <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                <button 
                  onClick={toggleMute}
                  className="p-1.5 text-neutral-400 hover:text-white transition"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-20 accent-amber-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Timeline Progress Bar */}
            <div className="flex-1 max-w-lg w-full flex items-center gap-3">
              <span className="text-[11px] font-mono text-neutral-400 shrink-0">
                {currentTime.toFixed(1)}s
              </span>
              <div 
                className="relative flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden cursor-pointer"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pos = (e.clientX - rect.left) / rect.width;
                  if (audioRef.current && duration) {
                    audioRef.current.currentTime = pos * duration;
                  }
                }}
              >
                <div 
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-sky-400 to-amber-400 transition-all duration-75"
                  style={{ width: `${(currentTime / (duration || 9)) * 100}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-neutral-500 shrink-0">
                {(duration || 9.0).toFixed(1)}s
              </span>
            </div>
          </div>
        </div>

        {/* Studio Control Deck */}
        <aside className="w-full lg:w-[380px] shrink-0 flex flex-col gap-5">
          {/* Section 1: Visual Mode & Color Presets */}
          <div className="architectural-panel p-5 rounded-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Visual Modes</span>
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setVisualMode('wavebars')}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition flex flex-col items-center gap-1.5 ${
                  visualMode === 'wavebars'
                    ? 'border-amber-400/50 bg-amber-400/10 text-white'
                    : 'border-white/[0.06] bg-white/[0.02] text-neutral-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <span>Wavebars</span>
              </button>

              <button
                onClick={() => setVisualMode('mirror')}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition flex flex-col items-center gap-1.5 ${
                  visualMode === 'mirror'
                    ? 'border-sky-400/50 bg-sky-400/10 text-white'
                    : 'border-white/[0.06] bg-white/[0.02] text-neutral-400 hover:text-white'
                }`}
              >
                <Waves className="w-4 h-4 text-sky-400" />
                <span>Mirror</span>
              </button>

              <button
                onClick={() => setVisualMode('solar')}
                className={`py-2 px-3 rounded-xl text-xs font-medium border transition flex flex-col items-center gap-1.5 ${
                  visualMode === 'solar'
                    ? 'border-emerald-400/50 bg-emerald-400/10 text-white'
                    : 'border-white/[0.06] bg-white/[0.02] text-neutral-400 hover:text-white'
                }`}
              >
                <Sun className="w-4 h-4 text-emerald-400" />
                <span>Solar Iris</span>
              </button>
            </div>

            {/* Mineral Color Presets */}
            <div className="pt-2 border-t border-white/[0.06] flex flex-col gap-2.5">
              <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                Palette Preset
              </span>
              <div className="grid grid-cols-2 gap-2">
                {COLOR_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setCurrentThemeId(theme.id)}
                    className={`p-2 rounded-xl border text-left transition flex items-center gap-2 ${
                      currentThemeId === theme.id
                        ? 'border-amber-400/60 bg-white/[0.05] text-white'
                        : 'border-white/[0.06] bg-white/[0.02] text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div 
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ background: theme.badge }}
                    />
                    <span className="text-xs truncate">{theme.name.split('&')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Display Typography */}
          <div className="architectural-panel p-5 rounded-2xl flex flex-col gap-4">
            <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <Disc3 className="w-3.5 h-3.5 text-amber-400" />
              <span>Track Typography</span>
            </span>

            {/* Stylized Dropdown for Font Family */}
            <div className="relative flex flex-col gap-1.5">
              <label className="text-[11px] text-neutral-400 font-medium flex items-center justify-between">
                <span>Font Foundry & Style</span>
                <span className="text-[10px] text-amber-400/80 font-mono">
                  {FONT_OPTIONS.find(f => f.id === fontFamily)?.style}
                </span>
              </label>

              <button
                type="button"
                onClick={() => setIsFontDropdownOpen(!isFontDropdownOpen)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-white/[0.08] bg-[#020614] hover:border-amber-400/50 text-left transition focus:outline-none shadow-inner"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-5 h-5 rounded-md bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0">
                    <Type className="w-3 h-3 text-amber-400" />
                  </div>
                  <span className="text-xs font-medium text-neutral-200 truncate">
                    {FONT_OPTIONS.find(f => f.id === fontFamily)?.label}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 shrink-0 ${isFontDropdownOpen ? 'rotate-180 text-amber-400' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {isFontDropdownOpen && (
                <div className="absolute top-[100%] mt-1.5 left-0 right-0 z-50 rounded-xl border border-white/[0.1] bg-[#070e24] shadow-2xl backdrop-blur-xl overflow-hidden py-1 divide-y divide-white/[0.04] animate-in fade-in-50 zoom-in-95 duration-100">
                  {FONT_OPTIONS.map((f) => {
                    const isSelected = fontFamily === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => {
                          setFontFamily(f.id);
                          setIsFontDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2 text-left text-xs transition ${
                          isSelected
                            ? 'bg-amber-400/15 text-amber-300 font-medium'
                            : 'text-neutral-300 hover:bg-white/[0.05] hover:text-white'
                        }`}
                      >
                        <div className="flex flex-col min-w-0">
                          <span className="truncate">{f.label}</span>
                          <span className="text-[10px] text-neutral-500 font-mono">{f.style}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-2" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-neutral-400 font-medium">Track Title</label>
              <input
                type="text"
                value={trackTitle}
                onChange={(e) => setTrackTitle(e.target.value)}
                className="w-full bg-[#020614] border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm font-semibold text-white focus:outline-none focus:border-amber-400 transition"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] text-neutral-400 font-medium">Composer / Artist</label>
                <span className="text-[10px] font-mono text-amber-400">{artistSize}px</span>
              </div>
              <input
                type="text"
                value={artistName}
                onChange={(e) => setArtistName(e.target.value)}
                className="w-full bg-[#020614] border border-white/[0.08] rounded-xl px-3.5 py-2 text-sm text-neutral-200 focus:outline-none focus:border-amber-400 transition"
              />
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-neutral-500 font-mono">SCALE</span>
                <input
                  type="range"
                  min="24"
                  max="52"
                  value={artistSize}
                  onChange={(e) => setArtistSize(Number(e.target.value))}
                  className="flex-1 h-1 bg-white/10 rounded-lg cursor-pointer accent-amber-400"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] text-neutral-400 font-medium">Eyebrow Badge</label>
              <input
                type="text"
                value={subBadge}
                onChange={(e) => setSubBadge(e.target.value)}
                className="w-full bg-[#020614] border border-white/[0.08] rounded-xl px-3.5 py-1.5 text-xs font-semibold text-amber-400 uppercase tracking-wider focus:outline-none focus:border-amber-400 transition"
              />
            </div>
          </div>

          {/* Section 3: Spectrum Geometry & Parameters */}
          <div className="architectural-panel p-5 rounded-2xl flex flex-col gap-3.5">
            <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
              <span>Waveform Craft</span>
            </span>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400">Bar Density</span>
                <span className="font-mono text-neutral-300">{barCount} bars</span>
              </div>
              <input
                type="range"
                min="32"
                max="96"
                step="4"
                value={barCount}
                onChange={(e) => setBarCount(Number(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400">Glow Spread</span>
                <span className="font-mono text-neutral-300">{glowIntensity}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="24"
                value={glowIntensity}
                onChange={(e) => setGlowIntensity(Number(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg cursor-pointer"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-400">Dynamic Amplitude</span>
                <span className="font-mono text-neutral-300">{barSensitivity}</span>
              </div>
              <input
                type="range"
                min="160"
                max="340"
                step="10"
                value={barSensitivity}
                onChange={(e) => setBarSensitivity(Number(e.target.value))}
                className="w-full h-1 bg-white/10 rounded-lg cursor-pointer"
              />
            </div>

            <div className="pt-2 flex items-center justify-between text-xs text-neutral-300">
              <span className="text-neutral-400">Perimeter Vignette</span>
              <button
                onClick={() => setShowVignette(!showVignette)}
                className={`w-9 h-5 rounded-full p-0.5 transition ${
                  showVignette ? 'bg-amber-400' : 'bg-white/20'
                }`}
              >
                <div 
                  className={`w-4 h-4 rounded-full bg-neutral-950 transition transform ${
                    showVignette ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Output Format & Twitter/X Encoding Guidance */}
          <div className="architectural-panel p-4 rounded-xl flex flex-col gap-2 text-xs font-mono">
            <div className="flex items-center justify-between text-neutral-300">
              <span className="text-neutral-500 uppercase tracking-wider text-[10px]">RECORDING ENGINE</span>
              <span className="text-emerald-400 font-semibold">
                Duration Auto-Injected
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-sans leading-relaxed">
              Recordings are patched with container timestamp headers on the fly so duration and seek bars work properly. To convert to standard 60fps MP4 for strict mobile and X playback, drop the video on <code className="text-amber-300 bg-white/[0.04] px-1 py-0.5 rounded">convert_for_x.bat</code>.
            </p>
          </div>
        </aside>
      </main>

      {/* Hidden Audio Source */}
      <audio
        ref={audioRef}
        src={audioSource}
        preload="auto"
        onTimeUpdate={handleAudioTimeUpdate}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
}
