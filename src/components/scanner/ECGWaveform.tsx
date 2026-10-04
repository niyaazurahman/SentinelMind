import React, { useRef, useEffect } from "react";

interface ECGWaveformProps {
  bpm?: number;
  color?: string;
  glowColor?: string;
  height?: number;
  showGrid?: boolean;
}

export const ECGWaveform: React.FC<ECGWaveformProps> = ({
  bpm = 72,
  color = "#f43f5e",
  glowColor = "#fda4af",
  height = 48,
  showGrid = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let t = 0;
    const points: number[] = [];
    const maxPoints = 120;

    const render = () => {
      const w = (canvas.width = canvas.parentElement?.clientWidth || 240);
      const h = (canvas.height = height);

      ctx.clearRect(0, 0, w, h);

      // Subtle Background Grid
      if (showGrid) {
        ctx.strokeStyle = "rgba(6, 182, 212, 0.08)";
        ctx.lineWidth = 1;
        const gridStep = 16;
        for (let x = 0; x < w; x += gridStep) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, h);
          ctx.stroke();
        }
        for (let y = 0; y < h; y += gridStep) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(w, y);
          ctx.stroke();
        }
      }

      // Generate ECG Cardiac Beat Function (P-Q-R-S-T pattern)
      t += 0.08 * (bpm / 72);
      const phase = (t % (Math.PI * 2)) / (Math.PI * 2); // 0 to 1

      let sampleY = 0;
      if (phase > 0.15 && phase < 0.22) {
        // P wave
        sampleY = Math.sin(((phase - 0.15) / 0.07) * Math.PI) * 0.18;
      } else if (phase >= 0.22 && phase < 0.25) {
        // Q dip
        sampleY = -0.15;
      } else if (phase >= 0.25 && phase < 0.31) {
        // R sharp spike
        sampleY = 0.95;
      } else if (phase >= 0.31 && phase < 0.35) {
        // S dip
        sampleY = -0.32;
      } else if (phase >= 0.45 && phase < 0.60) {
        // T wave
        sampleY = Math.sin(((phase - 0.45) / 0.15) * Math.PI) * 0.32;
      } else {
        // Baseline noise
        sampleY = (Math.random() - 0.5) * 0.04;
      }

      points.push(sampleY);
      if (points.length > maxPoints) {
        points.shift();
      }

      // Draw Waveform Line
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.8;
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 8;
      ctx.lineJoin = "round";

      const step = w / maxPoints;
      const centerY = h / 2;

      for (let i = 0; i < points.length; i++) {
        const x = i * step;
        const y = centerY - points[i] * (h * 0.42);
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // Lead Scanning Dot at Head of Wave
      if (points.length > 0) {
        const headX = (points.length - 1) * step;
        const headY = centerY - points[points.length - 1] * (h * 0.42);

        ctx.beginPath();
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 10;
        ctx.arc(headX, headY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [bpm, color, glowColor, height, showGrid]);

  return (
    <div className="w-full relative overflow-hidden rounded-lg bg-slate-950/60 border border-cyan-500/15">
      <canvas ref={canvasRef} className="w-full block" style={{ height: `${height}px` }} />
    </div>
  );
};
