"""
Pydantic Schemas for Real-Time Facial Analysis (DeepFace, MediaPipe, OpenCV).
"""

from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Optional
import uuid
from pydantic import BaseModel, Field


class RealTimeFrameAnalysisRequest(BaseModel):
    personnel_id: Optional[uuid.UUID] = None
    face_detected: bool = Field(default=True, description="Whether face bounding box was found")
    eye_aspect_ratio: Optional[float] = Field(None, ge=0.0, le=1.0)
    blink_rate_bpm: Optional[float] = Field(None, ge=0.0, le=120.0)
    mouth_aspect_ratio: Optional[float] = Field(None, ge=0.0, le=2.0)
    brow_tension_raw: Optional[float] = Field(None, ge=0.0, le=100.0)
    head_pitch: Optional[float] = Field(None, ge=-90.0, le=90.0)
    head_yaw: Optional[float] = Field(None, ge=-90.0, le=90.0)
    head_roll: Optional[float] = Field(None, ge=-90.0, le=90.0)
    image_base64: Optional[str] = Field(None, description="Optional raw frame snapshot")
    override_emotion: Optional[str] = None
    override_confidence: Optional[float] = None


class HeadTiltModel(BaseModel):
    pitch: float
    yaw: float
    roll: float


class RealTimeFrameAnalysisResponse(BaseModel):
    face_detected: bool
    message: Optional[str] = None
    emotion: str
    emotion_confidence: float
    emotion_distribution: Dict[str, float]
    eye_closure_percentage: float
    blink_rate: float
    is_yawning: bool
    head_tilt: HeadTiltModel
    fatigue_score: float
    fatigue_level: str
    facial_tension_score: float
    attention_score: float
    attention_level: str
    estimated_stress_score: float
    stress_level: str
    risk_category: str
    summary_text: str
    recorded_at: datetime
    record_id: Optional[uuid.UUID] = None


class FacialAnalysisHistoryItem(BaseModel):
    id: uuid.UUID
    recorded_at: datetime
    personnel_name: str
    rank: str
    emotion: str
    emotion_confidence: float
    stress_score: float
    stress_level: str
    fatigue_score: float
    fatigue_level: str
    attention_level: str
    eye_closure_percentage: float
    blink_rate: float
    is_yawning: bool
    head_pitch: float
    head_yaw: float
    head_roll: float
    risk_category: str
