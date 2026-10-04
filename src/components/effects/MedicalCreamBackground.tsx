import React, { useEffect, useRef, useState } from "react";

export const MedicalCreamBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });
  const [smoothMouse, setSmoothMouse] = useState({ x: -1000, y: -1000 });

  // Handle smooth mouse follower (cream interaction)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Smooth interpolation for liquid "cream" damping
  useEffect(() => {
    let animId: number;
    const updateSmooth = () => {
      setSmoothMouse((prev) => ({
        x: prev.x + (mousePos.x - prev.x) * 0.08,
        y: prev.y + (mousePos.y - prev.y) * 0.08,
      }));
      animId = requestAnimationFrame(updateSmooth);
    };
    animId = requestAnimationFrame(updateSmooth);
    return () => cancelAnimationFrame(animId);
  }, [mousePos]);

  // Canvas Neural Network & Medical Particle Web
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Particles: Bio-neural nodes
    const particleCount = Math.min(65, Math.floor((width * height) / 22000));
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      radius: Math.random() * 2 + 1.2,
      baseColor: Math.random() > 0.4 ? "rgba(6, 182, 212, " : "rgba(20, 184, 166, ",
    }));

    // ECG waveform animation state
    let ecgOffset = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw subtle ambient ECG heartbeat wave at bottom
      ctx.beginPath();
      ctx.strokeStyle = "rgba(6, 182, 212, 0.08)";
      ctx.lineWidth = 1.5;
      const ecgY = height * 0.88;
      ctx.moveTo(0, ecgY);
      for (let x = 0; x < width; x += 5) {
        const waveX = (x + ecgOffset) % 360;
        let dy = 0;
        // Periodic heartbeat spike
        if (waveX > 160 && waveX < 175) {
          dy = -Math.sin(((waveX - 160) / 15) * Math.PI) * 22;
        } else if (waveX >= 175 && waveX < 195) {
          dy = Math.sin(((waveX - 175) / 20) * Math.PI) * 45;
        } else if (waveX >= 195 && waveX < 210) {
          dy = -Math.sin(((waveX - 195) / 15) * Math.PI) * 18;
        }
        ctx.lineTo(x, ecgY + dy);
      }
      ctx.stroke();
      ecgOffset += 1.2;

      // 2. Draw Bio-neural connections
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.x += p1.vx;
        p1.y += p1.vy;

        if (p1.x < 0 || p1.x > width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > height) p1.vy *= -1;

        // Draw particle dot
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p1.baseColor}0.65)`;
        ctx.shadowColor = "rgba(6, 182, 212, 0.5)";
        ctx.shadowBlur = 8;
        ctx.fill();

        // Connect nearby nodes
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            const alpha = (1 - dist / 130) * 0.18;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(34, 211, 238, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.shadowBlur = 0;
            ctx.stroke();
          }
        }

        // Connect to smooth mouse (like stirring through glowing cream)
        const mouseDx = p1.x - smoothMouse.x;
        const mouseDy = p1.y - smoothMouse.y;
        const mouseDist = Math.sqrt(mouseDx * mouseDx + mouseDy * mouseDy);
        if (mouseDist < 180) {
          const mouseAlpha = (1 - mouseDist / 180) * 0.45;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(smoothMouse.x, smoothMouse.y);
          ctx.strokeStyle = `rgba(45, 212, 191, ${mouseAlpha})`;
          ctx.lineWidth = 1.2;
          ctx.stroke();

          // Gentle liquid push
          p1.x += (mouseDx / mouseDist) * 0.5;
          p1.y += (mouseDy / mouseDist) * 0.5;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [smoothMouse]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Deep medical gradient base */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#051125] to-[#030a17]" />

      {/* Floating Medical AI Ambient Blobs */}
      <div
        className="absolute top-1/4 left-1/5 w-[500px] h-[500px] rounded-full blur-[140px] opacity-25"
        style={{
          background: "radial-gradient(circle, #06b6d4 0%, #0891b2 50%, transparent 70%)",
        }}
      />
      <div
        className="absolute top-2/3 right-1/4 w-[600px] h-[600px] rounded-full blur-[160px] opacity-20"
        style={{
          background: "radial-gradient(circle, #14b8a6 0%, #0d9488 50%, transparent 70%)",
        }}
      />
      <div
        className="absolute -top-20 right-1/3 w-[450px] h-[450px] rounded-full blur-[150px] opacity-20"
        style={{
          background: "radial-gradient(circle, #3b82f6 0%, #1d4ed8 60%, transparent 75%)",
        }}
      />

      {/* Interactive Liquid Cream Mouse Glow */}
      <div
        className="absolute w-[450px] h-[450px] rounded-full blur-[90px] pointer-events-none transition-opacity duration-300"
        style={{
          left: `${smoothMouse.x - 225}px`,
          top: `${smoothMouse.y - 225}px`,
          background:
            "radial-gradient(circle, rgba(34, 211, 238, 0.22) 0%, rgba(20, 184, 166, 0.12) 45%, transparent 75%)",
          opacity: smoothMouse.x > 0 ? 1 : 0,
        }}
      />

      {/* Canvas for Neural Lines & ECG Particle Streams */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};
