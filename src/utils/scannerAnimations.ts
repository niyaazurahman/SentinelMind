/**
 * Scanner Animation Utilities for 60 FPS Smooth Face Tracking
 */

export interface TrackedFaceBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  yaw: number;
  pitch: number;
  roll: number;
}

/**
 * Linear interpolation for silky smooth bounding box motion
 */
export function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

/**
 * Smoothly interpolates an entire face bounding box
 */
export function interpolateBox(
  current: TrackedFaceBox,
  target: TrackedFaceBox,
  factor: number = 0.18
): TrackedFaceBox {
  return {
    x: lerp(current.x, target.x, factor),
    y: lerp(current.y, target.y, factor),
    width: lerp(current.width, target.width, factor),
    height: lerp(current.height, target.height, factor),
    confidence: lerp(current.confidence, target.confidence, factor * 0.5),
    yaw: lerp(current.yaw, target.yaw, factor),
    pitch: lerp(current.pitch, target.pitch, factor),
    roll: lerp(current.roll, target.roll, factor),
  };
}

export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}
