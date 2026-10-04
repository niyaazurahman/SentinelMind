"""
SentinelMind Vision: Computer Vision Facial Stress & Fatigue Analyzer.

Extracts biometric markers from facial video streams using OpenCV and MediaPipe Face Mesh:
1. Eye Closure: Eye Aspect Ratio (EAR)
2. Blink Frequency: Detection of rapid eyelid dip/recovery cycles
3. Facial Tension: Corrugator supercilii contraction (brow furrowing) and lip depressor tension
4. Yawning: Mouth Aspect Ratio (MAR) opening metrics
5. Head Posture: 3D head pose estimation (Pitch, Yaw, Roll)
6. Attention Level: Gaze direction and pose fixation stability
Outputs:
- Current Stress Score (0.00 - 100.00)
- Fatigue Score (0.00 - 100.00)
"""

from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple
import numpy as np

# MediaPipe Face Mesh Landmark Indices
LEFT_EYE_LANDMARKS = [33, 160, 158, 133, 153, 144]
RIGHT_EYE_LANDMARKS = [362, 385, 387, 263, 373, 380]
MOUTH_LIPS_LANDMARKS = [61, 291, 0, 17, 13, 14]
LEFT_EYEBROW = [70, 63, 105, 66, 107]
RIGHT_EYEBROW = [300, 293, 334, 296, 336]
NOSE_TIP = 1
CHIN = 152


@dataclass
class FacialMetricsResult:
    eye_closure_ratio: float
    blink_frequency_bpm: float
    facial_tension_score: float
    yawn_count: int
    head_pitch: float
    head_yaw: float
    head_roll: float
    attention_level: float
    current_stress_score: float
    fatigue_score: float
    risk_category: str


class FacialStressAnalyzer:
    """
    Analyzes webcam frames or landmark coordinate sets to compute stress,
    vagal tension, and physiological exhaustion indicators.
    """

    def __init__(
        self,
        ear_threshold: float = 0.21,
        mar_yawn_threshold: float = 0.65,
    ):
        self.ear_threshold = ear_threshold
        self.mar_yawn_threshold = mar_yawn_threshold
        self.blink_counter = 0
        self.yawn_counter = 0

    @staticmethod
    def calculate_ear(eye_points: np.ndarray) -> float:
        """
        Computes Eye Aspect Ratio (EAR) = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
        """
        if len(eye_points) < 6:
            return 0.30
        p1, p2, p3, p4, p5, p6 = eye_points[:6]
        vertical_dist1 = np.linalg.norm(p2 - p6)
        vertical_dist2 = np.linalg.norm(p3 - p5)
        horizontal_dist = np.linalg.norm(p1 - p4)
        if horizontal_dist == 0:
            return 0.30
        return float((vertical_dist1 + vertical_dist2) / (2.0 * horizontal_dist))

    @staticmethod
    def calculate_mar(mouth_points: np.ndarray) -> float:
        """
        Computes Mouth Aspect Ratio (MAR) to detect involuntary yawn duration.
        """
        if len(mouth_points) < 6:
            return 0.20
        # corners: p1, p2; upper/lower: p3, p4, p5, p6
        corner_left, corner_right = mouth_points[0], mouth_points[1]
        top_lip, bottom_lip = mouth_points[4], mouth_points[5]
        horizontal = np.linalg.norm(corner_left - corner_right)
        vertical = np.linalg.norm(top_lip - bottom_lip)
        if horizontal == 0:
            return 0.20
        return float(vertical / horizontal)

    def analyze_frame_features(
        self,
        ear: float,
        blinks_per_min: float,
        brow_furrow_distance: float,
        mar: float,
        head_pitch: float,
        head_yaw: float,
        head_roll: float,
        normative_ear: float = 0.30,
        normative_brow_distance: float = 38.0,
    ) -> FacialMetricsResult:
        """
        Translates geometric facial metrics into standardized stress & fatigue scores.
        """
        # 1. Eye Closure & Droop (% reduction relative to normative EAR)
        closure_ratio = min(1.0, max(0.0, ear))
        ear_droop_pct = max(0.0, (normative_ear - ear) / normative_ear) * 100.0 if normative_ear > 0 else 0.0

        # 2. Facial Tension Score (Brow furrowing + jaw clench)
        # Narrower distance between eyebrows signifies acute corrugator supercilii stress contraction
        brow_contraction_pct = max(0.0, (normative_brow_distance - brow_furrow_distance) / normative_brow_distance) * 100.0
        tension_score = np.clip(brow_contraction_pct * 1.5 + (blinks_per_min > 28.0) * 15.0, 0.0, 100.0)

        # 3. Yawning Count
        is_yawning = mar >= self.mar_yawn_threshold
        yawn_increment = 1 if is_yawning else 0

        # 4. Attention Level (Penalized by head drift from forward gaze)
        pose_deviation = np.sqrt(head_pitch**2 + head_yaw**2 + head_roll**2)
        attention_level = float(np.clip(100.0 - (pose_deviation * 2.2), 10.0, 100.0))

        # 5. Composite Fatigue Score
        # Heavy eyelids + frequent yawning + head nodding (pitch down)
        head_nod_penalty = max(0.0, head_pitch * 1.8) if head_pitch > 0 else 0.0
        fatigue_score = float(np.clip(
            (ear_droop_pct * 0.45) +
            (min(blinks_per_min, 40.0) * 0.6) +
            (yawn_increment * 25.0) +
            head_nod_penalty,
            0.0,
            100.0,
        ))

        # 6. Current Facial Stress Score
        # High facial tension + rapid blinking + attention fluctuation
        current_stress_score = float(np.clip(
            (tension_score * 0.55) +
            (fatigue_score * 0.30) +
            ((100.0 - attention_level) * 0.15),
            0.0,
            100.0,
        ))

        # Categorize
        if current_stress_score <= 30.0:
            risk_category = "GREEN"
        elif current_stress_score <= 60.0:
            risk_category = "AMBER"
        else:
            risk_category = "RED"

        return FacialMetricsResult(
            eye_closure_ratio=round(closure_ratio, 3),
            blink_frequency_bpm=round(blinks_per_min, 1),
            facial_tension_score=round(tension_score, 1),
            yawn_count=yawn_increment,
            head_pitch=round(head_pitch, 1),
            head_yaw=round(head_yaw, 1),
            head_roll=round(head_roll, 1),
            attention_level=round(attention_level, 1),
            current_stress_score=round(current_stress_score, 1),
            fatigue_score=round(fatigue_score, 1),
            risk_category=risk_category,
        )
