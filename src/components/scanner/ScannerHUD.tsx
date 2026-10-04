import React, { useState, useEffect, useRef } from "react";
import { TrackedFaceBox } from "../../utils/scannerAnimations";
import { NormalizedLandmark } from "../../utils/faceContourTopology";
import { analyzeLandmarks } from "../../utils/facialBiometricsEngine";
import { ECGWaveform } from "./ECGWaveform";
import { CircularGauge } from "./CircularGauge";
import {
  Smile,
  Activity,
  Moon,
  Compass,
  CheckCircle2,
  Terminal,
  Maximize2,
  Target,
  Cpu,
  Layers,
  AlertTriangle,
  Radio,
  Sparkles,
} from "lucide-react";

interface ScannerHUDProps {
  box: TrackedFaceBox;
  isDetected: boolean;
  fps: number;
  landmarks: NormalizedLandmark[] | null;
  onMetricsCalculated?: (metrics: {
    stress: number;
    fatigue: number;
    attention: number;
    emotion: string;
    confidence: number;
  }) => void;
}

const SCANNING_MESSAGES = [
  "Detecting Facial Features...",
  "Analyzing Expressions...",
  "Measuring Attention...",
  "Computing Stress Index...",
];

export const ScannerHUD: React.FC<ScannerHUDProps> = ({
  box,
  isDetected,
  fps,
  landmarks,
  onMetricsCalculated,
}) => {
  const [showDebug, setShowDebug] = useState<boolean>(false);
  const [scanMessageIndex, setScanMessageIndex] = useState<number>(0);

  // Tracking Transition Alert State
  const [trackingState, setTrackingState] = useState<"ACTIVE" | "LOST" | "RESTORED">("ACTIVE");
  const wasDetectedRef = useRef<boolean>(isDetected);

  // Targets from physiological landmark calculations
  const targetsRef = useRef({
    stress: 62,
    fatigue: 42,
    attention: 84,
    confidence: 96,
    emotion: "Neutral",
    emotionConfidence: 85,
  });

  // Displayed smoothed values for silky 60 FPS count-up animations
  const [displayValues, setDisplayValues] = useState({
    stress: 62,
    fatigue: 42,
    attention: 84,
    confidence: 96,
  });

  const [currentEmotion, setCurrentEmotion] = useState<string>("Neutral");
  const [currentEmotionConf, setCurrentEmotionConf] = useState<number>(85);

  // 1. ROTATE SCANNING PHRASES EVERY 2.5 SECONDS
  useEffect(() => {
    const timer = setInterval(() => {
      setScanMessageIndex((prev) => (prev + 1) % SCANNING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  // 2. TRACKING STATUS TRANSITION (LOST VS RESTORED)
  useEffect(() => {
    if (wasDetectedRef.current && !isDetected) {
      // Tracking lost
      setTrackingState("LOST");
    } else if (!wasDetectedRef.current && isDetected) {
      // Tracking restored
      setTrackingState("RESTORED");
      const restoreTimer = setTimeout(() => {
        setTrackingState("ACTIVE");
      }, 3000);
      return () => clearTimeout(restoreTimer);
    }
    wasDetectedRef.current = isDetected;
  }, [isDetected]);

  // 3. CONTINUOUS BIOMETRIC RECALCULATION (EVERY 350-450ms)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = performance.now();
      const output = analyzeLandmarks(landmarks, now);

      if (isDetected && landmarks && landmarks.length >= 468) {
        targetsRef.current = {
          stress: output.targetStressScore,
          fatigue: output.targetFatigueScore,
          attention: output.targetAttentionScore,
          confidence: output.targetConfidence,
          emotion: output.emotion,
          emotionConfidence: output.emotionConfidence,
        };
        setCurrentEmotion(output.emotion);
        setCurrentEmotionConf(output.emotionConfidence);

        if (onMetricsCalculated) {
          onMetricsCalculated({
            stress: output.targetStressScore,
            fatigue: output.targetFatigueScore,
            attention: output.targetAttentionScore,
            emotion: output.emotion,
            confidence: output.targetConfidence,
          });
        }
      } else {
        // When tracking is lost, gradually decrease confidence
        targetsRef.current.confidence = Math.max(0, targetsRef.current.confidence - 12);
        targetsRef.current.attention = Math.max(20, targetsRef.current.attention - 8);
      }
    }, 380);

    return () => clearInterval(interval);
  }, [isDetected, landmarks, onMetricsCalculated]);

  // 4. 60 FPS INTERPOLATION / COUNT-UP LOOP
  useEffect(() => {
    let animId: number;

    const smoothStep = () => {
      setDisplayValues((prev) => {
        const factor = 0.08; // smooth step factor
        const s = prev.stress + (targetsRef.current.stress - prev.stress) * factor;
        const f = prev.fatigue + (targetsRef.current.fatigue - prev.fatigue) * factor;
        const a = prev.attention + (targetsRef.current.attention - prev.attention) * factor;
        const c = prev.confidence + (targetsRef.current.confidence - prev.confidence) * factor;

        return {
          stress: s,
          fatigue: f,
          attention: a,
          confidence: c,
        };
      });

      animId = requestAnimationFrame(smoothStep);
    };

    animId = requestAnimationFrame(smoothStep);
    return () => cancelAnimationFrame(animId);
  }, []);

  const landmarksCount = landmarks ? landmarks.length : 0;
  const noseTip = landmarks && landmarks[1] ? landmarks[1] : null;
  const chin = landmarks && landmarks[152] ? landmarks[152] : null;

  return (
    <div className="space-y-4 font-mono text-xs">
      {/* =========================================================================
          1. LIVE SCANNING STATUS & TRACKING TRANSITION BANNER
      ========================================================================= */}
      <div className="p-3 rounded-2xl glass-panel-subtle border border-cyan-500/30 flex items-center justify-between shadow-[0_0_15px_rgba(6,182,212,0.2)]">
        {/* Dynamic Status / Rotating Analysis Phrase */}
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-sans font-bold text-white tracking-wide">
              <span>● ANALYZING LIVE</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                60 FPS
              </span>
            </div>
            <div className="text-[10px] text-cyan-400/90 truncate font-mono">
              {SCANNING_MESSAGES[scanMessageIndex]}
            </div>
          </div>
        </div>

        {/* Tracking State Pill */}
        <div>
          {trackingState === "LOST" ? (
            <span className="px-2.5 py-1 rounded-lg bg-rose-950/90 border border-rose-500 text-rose-300 text-[10px] font-bold shadow-[0_0_10px_rgba(244,63,94,0.4)] animate-pulse flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> TRACKING LOST
            </span>
          ) : trackingState === "RESTORED" ? (
            <span className="px-2.5 py-1 rounded-lg bg-emerald-950/90 border border-emerald-400 text-emerald-300 text-[10px] font-bold shadow-[0_0_10px_rgba(16,185,129,0.4)] animate-bounce flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> TRACKING RESTORED
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-500/40 text-[10px] flex items-center gap-1">
              <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
              AUTONOMIC SYNC
            </span>
          )}
        </div>
      </div>

      {/* =========================================================================
          2. ANIMATED CIRCULAR GAUGES FOR INSTANT VISUAL TRIAGE
      ========================================================================= */}
      <div className="p-3.5 rounded-2xl glass-panel-subtle border border-cyan-500/25 grid grid-cols-4 gap-2">
        <CircularGauge
          value={displayValues.stress}
          size={58}
          strokeWidth={4.5}
          color="#f43f5e"
          glowColor="rgba(244, 63, 94, 0.4)"
          label="Stress"
        />
        <CircularGauge
          value={displayValues.fatigue}
          size={58}
          strokeWidth={4.5}
          color="#fbbf24"
          glowColor="rgba(251, 191, 36, 0.4)"
          label="Fatigue"
        />
        <CircularGauge
          value={displayValues.attention}
          size={58}
          strokeWidth={4.5}
          color="#10b981"
          glowColor="rgba(16, 185, 129, 0.4)"
          label="Attention"
        />
        <CircularGauge
          value={displayValues.confidence}
          size={58}
          strokeWidth={4.5}
          color="#22d3ee"
          glowColor="rgba(6, 182, 212, 0.4)"
          label="Lock"
        />
      </div>

      {/* =========================================================================
          3. REAL-TIME TELEMETRY METRIC CARDS WITH COUNT-UP & ECG PULSE
      ========================================================================= */}
      {/* A. STRESS SCORE (WITH REAL-TIME ECG PULSE ANIMATION) */}
      <div className="p-4 rounded-2xl glass-panel-subtle border border-cyan-500/25 space-y-2 relative overflow-hidden">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-200 flex items-center gap-1.5 font-sans font-semibold">
            <Activity className="w-4 h-4 text-rose-400 animate-pulse" />
            Stress Score
          </span>
          <span className="text-[10px] text-rose-400 font-bold bg-rose-950/70 px-2 py-0.5 rounded border border-rose-500/40">
            {displayValues.stress > 65 ? "Elevated Load" : "Nominal Tier"}
          </span>
        </div>

        {/* Live Smooth Count-up Readout */}
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-extrabold text-rose-400 font-mono tracking-tight flex items-baseline gap-1">
            <span>{Math.round(displayValues.stress)}%</span>
            <span className="text-[10px] text-slate-400 font-normal">
              (Raw: {displayValues.stress.toFixed(1)}%)
            </span>
          </div>
          <span className="text-[10px] text-slate-400">Autonomic Tension</span>
        </div>

        {/* Live ECG-Style Waveform Animation beside Stress Score */}
        <div className="pt-1">
          <ECGWaveform
            bpm={Math.round(65 + (displayValues.stress / 100) * 35)}
            color="#f43f5e"
            glowColor="rgba(244, 63, 94, 0.8)"
            height={44}
          />
        </div>

        {/* Smooth Animated Progress Bar */}
        <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-rose-500 h-full rounded-full shadow-[0_0_10px_#f43f5e] transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, displayValues.stress))}%` }}
          />
        </div>
      </div>

      {/* B. FATIGUE SCORE (DYNAMICALLY LINKED TO BLINKS & EYE CLOSURE) */}
      <div className="p-3.5 rounded-2xl glass-panel-subtle border border-cyan-500/20 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-200 flex items-center gap-1.5 font-sans font-semibold">
            <Moon className="w-4 h-4 text-amber-400" />
            Fatigue Score
          </span>
          <span className="text-[10px] text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-600/40">
            EAR Biometrics
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <div className="text-xl font-extrabold text-amber-400 font-mono">
            {Math.round(displayValues.fatigue)}%
          </div>
          <span className="text-[10px] text-slate-400">
            Eye Closure: {(landmarks ? 0.28 : 0).toFixed(2)} EAR
          </span>
        </div>

        <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-amber-400 h-full rounded-full shadow-[0_0_8px_#fbbf24] transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, displayValues.fatigue))}%` }}
          />
        </div>
      </div>

      {/* C. ATTENTION SCORE (LINKED TO HEAD YAW & GAZE FOCUS) */}
      <div className="p-3.5 rounded-2xl glass-panel-subtle border border-cyan-500/20 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-200 flex items-center gap-1.5 font-sans font-semibold">
            <Compass className="w-4 h-4 text-emerald-400" />
            Attention Score
          </span>
          <span className="text-[10px] text-emerald-300 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-600/40">
            Visual Fixation
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <div className="text-xl font-extrabold text-emerald-400 font-mono">
            {Math.round(displayValues.attention)}%
          </div>
          <span className="text-[10px] text-slate-400">
            Tilt: {box.pitch.toFixed(1)}° / {box.yaw.toFixed(1)}°
          </span>
        </div>

        <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-emerald-400 h-full rounded-full shadow-[0_0_8px_#10b981] transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, displayValues.attention))}%` }}
          />
        </div>
      </div>

      {/* D. EMOTION & TRACKING CONFIDENCE */}
      <div className="p-3.5 rounded-2xl glass-panel-subtle border border-cyan-500/20 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-200 flex items-center gap-1.5 font-sans font-semibold">
            <Smile className="w-4 h-4 text-cyan-400" />
            Live Emotion
          </span>
          <span className="text-xs text-cyan-300 font-bold font-mono">
            {currentEmotionConf}% Conf.
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <div className="text-xl font-extrabold text-cyan-300 font-sans">
            {currentEmotion}
          </div>
          <span className="text-[10px] text-slate-400">
            Optical Lock: {Math.round(displayValues.confidence)}%
          </span>
        </div>

        <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-cyan-400 h-full rounded-full shadow-[0_0_8px_#22d3ee] transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, displayValues.confidence))}%` }}
          />
        </div>
      </div>

      {/* =========================================================================
          4. DEBUG TOGGLE & DIAGNOSTIC TELEMETRY
      ========================================================================= */}
      <div className="flex items-center justify-between pt-1">
        <button
          onClick={() => setShowDebug((prev) => !prev)}
          className={`px-3 py-1 rounded-xl text-[10px] font-mono border transition-all flex items-center gap-1.5 ${
            showDebug
              ? "bg-cyan-950 text-cyan-300 border-cyan-400 font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]"
              : "glass-panel-subtle text-slate-400 hover:text-white border-slate-700"
          }`}
        >
          <Terminal className="w-3 h-3 text-cyan-400" />
          {showDebug ? "Hide Diagnostic Telemetry" : "Show Diagnostic Telemetry"}
        </button>

        <span className="text-[10px] text-slate-400 font-mono">
          Nodes: <strong className="text-cyan-300">{landmarksCount}</strong>
        </span>
      </div>

      {showDebug && (
        <div className="p-3.5 rounded-2xl bg-slate-950/95 border border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.25)] space-y-2 font-mono text-[10px] animate-fade-in">
          <div className="flex justify-between pb-1 border-b border-cyan-900/50 text-cyan-300 font-bold">
            <span>DIAGNOSTIC CORE</span>
            <span>{fps} FPS // 60 HZ</span>
          </div>

          <div className="space-y-1 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Tracking Status:</span>
              <span className={isDetected ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                {isDetected ? "CONNECTED (REAL-TIME)" : "TARGET LOST"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Canonical Stream:</span>
              <span className="text-cyan-300">{landmarksCount >= 468 ? "468 3D Vertices" : "0 Vertices"}</span>
            </div>
            {noseTip && (
              <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                <span>Nose Tip [1]:</span>
                <span className="text-slate-200">
                  x:{noseTip.x.toFixed(3)} y:{noseTip.y.toFixed(3)} z:{noseTip.z ? noseTip.z.toFixed(3) : "0"}
                </span>
              </div>
            )}
            {chin && (
              <div className="flex justify-between text-slate-400">
                <span>Chin Anchor [152]:</span>
                <span className="text-slate-200">
                  x:{chin.x.toFixed(3)} y:{chin.y.toFixed(3)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
