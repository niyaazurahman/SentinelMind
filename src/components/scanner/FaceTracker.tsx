import React, { useRef, useState, useEffect, useCallback } from "react";
import { TrackedFaceBox, interpolateBox } from "../../utils/scannerAnimations";
import { NormalizedLandmark } from "../../utils/faceContourTopology";
import { ScannerOverlay } from "./ScannerOverlay";
import { Camera, RefreshCw, UserX } from "lucide-react";

declare global {
  interface Window {
    FaceMesh?: any;
    Camera?: any;
  }
}

interface FaceTrackerProps {
  streamActive: boolean;
  isSimulatorMode: boolean;
  isFaceActive: boolean;
  simulatedFaceLoss: boolean;
  onBoxUpdate: (box: TrackedFaceBox, fps: number) => void;
  onLandmarksUpdate: (landmarks: NormalizedLandmark[] | null) => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onStartCamera: () => void;
  onResetSimulatedFaceLoss: () => void;
}

export const FaceTracker: React.FC<FaceTrackerProps> = ({
  streamActive,
  isSimulatorMode,
  isFaceActive,
  simulatedFaceLoss,
  onBoxUpdate,
  onLandmarksUpdate,
  videoRef,
  onStartCamera,
  onResetSimulatedFaceLoss,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const faceMeshRef = useRef<any>(null);

  // Real landmarks received from MediaPipe FaceMesh
  const [realLandmarks, setRealLandmarks] = useState<NormalizedLandmark[] | null>(null);

  // Current interpolated box for smooth tracking
  const currentBoxRef = useRef<TrackedFaceBox>({
    x: 200,
    y: 120,
    width: 240,
    height: 280,
    confidence: 96.4,
    yaw: 0,
    pitch: 0,
    roll: 0,
  });

  const targetBoxRef = useRef<TrackedFaceBox>({
    x: 200,
    y: 120,
    width: 240,
    height: 280,
    confidence: 96.4,
    yaw: 0,
    pitch: 0,
    roll: 0,
  });

  const [renderedBox, setRenderedBox] = useState<TrackedFaceBox>(currentBoxRef.current);
  const [fps, setFps] = useState<number>(60);

  // Initialize MediaPipe Face Mesh on live camera feed
  useEffect(() => {
    if (!streamActive || simulatedFaceLoss) {
      setRealLandmarks(null);
      onLandmarksUpdate(null);
      return;
    }

    let isMounted = true;
    let frameId: number;
    let isProcessing = false;

    const setupFaceMesh = async () => {
      // Wait for window.FaceMesh to be ready from CDN script
      if (!window.FaceMesh) {
        console.warn("[MediaPipe FaceMesh] Awaiting FaceMesh script load...");
        return;
      }

      try {
        const faceMesh = new window.FaceMesh({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        faceMesh.onResults((results: any) => {
          if (!isMounted) return;

          if (
            results.multiFaceLandmarks &&
            results.multiFaceLandmarks.length > 0 &&
            !simulatedFaceLoss
          ) {
            const rawPoints: NormalizedLandmark[] = results.multiFaceLandmarks[0];

            setRealLandmarks(rawPoints);
            onLandmarksUpdate(rawPoints);

            // Compute dynamic bounding box directly from actual landmark coordinates
            if (containerRef.current) {
              const containerW = containerRef.current.clientWidth || 640;
              const containerH = containerRef.current.clientHeight || 480;

              let minX = 1, maxX = 0, minY = 1, maxY = 0;
              for (let i = 0; i < rawPoints.length; i++) {
                const pt = rawPoints[i];
                if (pt.x < minX) minX = pt.x;
                if (pt.x > maxX) maxX = pt.x;
                if (pt.y < minY) minY = pt.y;
                if (pt.y > maxY) maxY = pt.y;
              }

              // Pad slightly for visual clearance
              const padX = 0.05;
              const padY = 0.06;
              const boxW = Math.max(120, (maxX - minX + padX * 2) * containerW);
              const boxH = Math.max(140, (maxY - minY + padY * 2) * containerH);
              // Mirror X position for front-facing camera
              const centerX = (1 - (minX + maxX) / 2) * containerW;
              const centerY = ((minY + maxY) / 2) * containerH;

              targetBoxRef.current = {
                x: Math.max(10, Math.min(containerW - boxW - 10, centerX - boxW / 2)),
                y: Math.max(10, Math.min(containerH - boxH - 10, centerY - boxH / 2)),
                width: boxW,
                height: boxH,
                confidence: 97.4,
                yaw: (rawPoints[1].x - 0.5) * 60,
                pitch: (rawPoints[1].y - 0.5) * 60,
                roll: (rawPoints[263].y - rawPoints[33].y) * 80,
              };
            }
          } else {
            // NO LANDMARKS DETECTED -> DO NOT RENDER ANY FACE CONTOUR
            setRealLandmarks(null);
            onLandmarksUpdate(null);
          }
        });

        faceMeshRef.current = faceMesh;

        // Continuous async frame feeding loop
        const loop = async () => {
          if (!isMounted) return;

          const video = videoRef.current;
          if (
            video &&
            video.readyState >= 2 &&
            !video.paused &&
            !isProcessing &&
            faceMeshRef.current
          ) {
            isProcessing = true;
            try {
              await faceMeshRef.current.send({ image: video });
            } catch (err) {
              // Frame dropped or busy
            } finally {
              isProcessing = false;
            }
          }

          frameId = requestAnimationFrame(loop);
        };

        frameId = requestAnimationFrame(loop);
      } catch (err) {
        console.error("[MediaPipe FaceMesh] Initialization error:", err);
      }
    };

    setupFaceMesh();

    return () => {
      isMounted = false;
      if (frameId) cancelAnimationFrame(frameId);
      if (faceMeshRef.current) {
        try {
          faceMeshRef.current.close();
        } catch {
          // ignore
        }
        faceMeshRef.current = null;
      }
    };
  }, [streamActive, simulatedFaceLoss, videoRef, onLandmarksUpdate]);

  // High-performance 60 FPS requestAnimationFrame Interpolation Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let frameCount = 0;

    const renderLoop = (time: number) => {
      frameCount++;
      if (time - lastTime >= 1000) {
        const currentFps = Math.round((frameCount * 1000) / (time - lastTime));
        setFps(currentFps);
        frameCount = 0;
        lastTime = time;
      }

      if (isFaceActive) {
        currentBoxRef.current = interpolateBox(currentBoxRef.current, targetBoxRef.current, 0.18);
        setRenderedBox({ ...currentBoxRef.current });
        onBoxUpdate(currentBoxRef.current, fps);
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, [isFaceActive, onBoxUpdate, fps]);

  return (
    <div
      ref={containerRef}
      className="relative bg-slate-950/90 rounded-2xl border border-cyan-500/30 overflow-hidden aspect-video flex items-center justify-center shadow-[0_0_35px_rgba(6,182,212,0.15)]"
    >
      {/* Live Mirrored Webcam Feed */}
      <video
        ref={videoRef}
        playsInline
        autoPlay
        muted
        className={`w-full h-full object-cover transform -scale-x-100 ${
          streamActive && !isSimulatorMode ? "block" : "hidden"
        }`}
      />

      {/* Standby Backdrop */}
      {(!streamActive || isSimulatorMode) && (
        <div className="text-center p-6 space-y-3 z-10 pointer-events-none">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-950 via-teal-900 to-slate-900 border border-cyan-400/50 text-cyan-300 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(6,182,212,0.35)]">
            <Camera className="w-7 h-7 animate-pulse" />
          </div>
          <div className="text-base font-bold text-white font-sans">
            {isSimulatorMode ? "Real-Time Camera Standby" : "Webcam Feed Standby"}
          </div>
          <p className="text-xs text-slate-300 font-sans max-w-sm mx-auto">
            Click 'Start Camera' to initialize the optical feed and stream real MediaPipe facial contours.
          </p>
        </div>
      )}

      {/* SCANNER OVERLAY - RENDERS ONLY REAL LANDMARKS */}
      <ScannerOverlay
        box={renderedBox}
        isDetected={isFaceActive && !simulatedFaceLoss}
        fps={fps}
        landmarks={realLandmarks}
      />

      {/* NO FACE DETECTED OVERLAY */}
      {(!isFaceActive || simulatedFaceLoss) && streamActive && (
        <div className="absolute inset-0 bg-slate-950/92 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-rose-950/80 border border-rose-500/60 text-rose-300 flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(244,63,94,0.35)] animate-pulse">
            <UserX className="w-9 h-9" />
          </div>
          <h3 className="text-lg font-bold text-rose-300 font-mono tracking-wide">
            No face detected. Please look at the camera.
          </h3>
          <p className="text-xs text-slate-300 font-sans mt-1.5 max-w-md">
            Optical sensor lost target. Ensure adequate ambient illumination and face the camera directly.
          </p>
          {simulatedFaceLoss && (
            <button
              onClick={onResetSimulatedFaceLoss}
              className="mt-4 px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-bold text-xs font-mono rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.4)] pointer-events-auto"
            >
              Resume Face Tracking
            </button>
          )}
        </div>
      )}
    </div>
  );
};
