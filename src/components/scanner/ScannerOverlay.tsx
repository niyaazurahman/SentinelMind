import React, { useRef, useEffect } from "react";
import { TrackedFaceBox } from "../../utils/scannerAnimations";
import {
  ALL_OFFICIAL_CONTOURS,
  NormalizedLandmark,
} from "../../utils/faceContourTopology";
import { Sparkles, Cpu, Eye } from "lucide-react";

interface ScannerOverlayProps {
  box: TrackedFaceBox;
  isDetected: boolean;
  fps: number;
  landmarks: NormalizedLandmark[] | null;
}

export const ScannerOverlay: React.FC<ScannerOverlayProps> = ({
  box,
  isDetected,
  fps,
  landmarks,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 60 FPS Canvas rendering loop for genuine MediaPipe facial contours
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const render = () => {
      const width = (canvas.width = canvas.parentElement?.clientWidth || 640);
      const height = (canvas.height = canvas.parentElement?.clientHeight || 480);

      ctx.clearRect(0, 0, width, height);

      // REQUIREMENT 9 & 11:
      // If landmarks are not available or not detected, DO NOT RENDER ANY FACE CONTOUR.
      // Only render when genuine MediaPipe landmarks exist (length >= 468).
      if (isDetected && landmarks && landmarks.length >= 468) {
        // Draw the 5 official MediaPipe facial contour groups
        ALL_OFFICIAL_CONTOURS.forEach((group) => {
          ctx.beginPath();
          ctx.strokeStyle = group.color;
          ctx.lineWidth = group.width;
          ctx.shadowColor = "#00f0ff";
          ctx.shadowBlur = 8;

          for (let i = 0; i < group.edges.length; i++) {
            const [idxA, idxB] = group.edges[i];
            const ptA = landmarks[idxA];
            const ptB = landmarks[idxB];

            if (ptA && ptB) {
              // Convert normalized coordinates (0..1) to canvas pixel space
              // Mirror X for front-facing camera display
              const xA = (1 - ptA.x) * width;
              const yA = ptA.y * height;
              const xB = (1 - ptB.x) * width;
              const yB = ptB.y * height;

              ctx.moveTo(xA, yA);
              ctx.lineTo(xB, yB);
            }
          }
          ctx.stroke();
        });

        // Key landmark control anchor points (eyes, nose tip, lips, chin)
        const keyIndices = [
          1,    // Nose tip
          4,    // Nose bottom
          33,   // Right eye outer
          133,  // Right eye inner
          362,  // Left eye inner
          263,  // Left eye outer
          61,   // Right mouth corner
          291,  // Left mouth corner
          10,   // Forehead top
          152,  // Chin
        ];

        ctx.fillStyle = "#38bdf8";
        ctx.shadowColor = "#00f0ff";
        ctx.shadowBlur = 6;
        for (let i = 0; i < keyIndices.length; i++) {
          const pt = landmarks[keyIndices[i]];
          if (pt) {
            const px = (1 - pt.x) * width;
            const py = pt.y * height;
            ctx.beginPath();
            ctx.arc(px, py, 2.0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [isDetected, landmarks]);

  if (!isDetected) return null;

  const hasRealLandmarks = landmarks && landmarks.length >= 468;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
      {/* REAL-TIME CAMERA CONTOUR CANVAS (STRICTLY FROM ACTUAL LANDMARKS) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {/* SMOOTHLY MOVING BLUE GLOWING BOUNDING BOX */}
      <div
        className="absolute rounded-2xl transition-all duration-75 ease-out flex flex-col justify-between"
        style={{
          left: `${box.x}px`,
          top: `${box.y}px`,
          width: `${box.width}px`,
          height: `${box.height}px`,
          boxShadow: "0 0 35px rgba(6, 182, 212, 0.4), inset 0 0 20px rgba(6, 182, 212, 0.15)",
          border: "2px solid rgba(34, 211, 238, 0.65)",
          transform: `rotate(${box.roll * 0.3}deg)`,
        }}
      >
        {/* CORNER SCANNER BRACKETS */}
        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-3 border-l-3 border-cyan-300 rounded-tl-lg shadow-[0_0_10px_#22d3ee]" />
        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-3 border-r-3 border-cyan-300 rounded-tr-lg shadow-[0_0_10px_#22d3ee]" />
        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-3 border-l-3 border-cyan-300 rounded-bl-lg shadow-[0_0_10px_#22d3ee]" />
        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-3 border-r-3 border-cyan-300 rounded-br-lg shadow-[0_0_10px_#22d3ee]" />

        {/* HORIZONTAL SCANNING LINE */}
        <div
          className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#22d3ee] animate-pulse"
          style={{
            top: "45%",
            animation: "scanSweepY 2.8s ease-in-out infinite alternate",
          }}
        />

        {/* TOP HUD STATUS PILL */}
        <div className="relative -top-10 flex items-center justify-between w-full px-1">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/90 border border-cyan-400 text-[10px] font-mono font-bold text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)] backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>FACE DETECTED</span>
          </div>

          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-950/90 border text-[10px] font-mono backdrop-blur-md ${
              hasRealLandmarks
                ? "border-teal-400 text-teal-300 shadow-[0_0_10px_rgba(20,184,166,0.3)]"
                : "border-slate-700 text-slate-400"
            }`}
          >
            <Cpu className="w-3 h-3 text-teal-400 animate-pulse" />
            <span>{hasRealLandmarks ? "468 LANDMARKS ACTIVE" : "AWAITING LANDMARKS"}</span>
          </div>
        </div>

        {/* BOTTOM HUD STATUS */}
        <div className="relative -bottom-10 flex items-center justify-between w-full px-1">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-950/90 border border-cyan-500/40 text-[10px] font-mono text-slate-300 backdrop-blur-md">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>{hasRealLandmarks ? "REAL CONTOURS ALIGNED" : "BOUNDING BOX LOCK"}</span>
          </div>

          <div className="px-2.5 py-0.5 rounded-md bg-slate-950/90 border border-cyan-400 text-[10px] font-mono font-bold text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.3)] backdrop-blur-md">
            {Math.round(box.confidence)}% CONFIDENCE
          </div>
        </div>
      </div>

      <style>{`
        @keyframes scanSweepY {
          0% { top: 6%; opacity: 0.2; }
          50% { opacity: 0.95; }
          100% { top: 92%; opacity: 0.2; }
        }
      `}</style>
    </div>
  );
};
