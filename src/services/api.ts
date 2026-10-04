/**
 * SentinelMind Master API Client.
 * Connects React Frontend with FastAPI Backend, PostgreSQL,
 * XGBoost Regressor, Isolation Forest, and SHAP Explainability services.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export interface TelemetryPayload {
  personnel_id: string;
  sleep_hours: number;
  hrv: number;
  resting_heart_rate: number;
  duty_hours: number;
  mood_score: number;
  stress_score: number;
  sensor_source?: string;
  clinical_notes?: string;
}

export interface AnomalyRequest {
  sleep_hours: number;
  hrv: number;
  mood_score: number;
  duty_hours: number;
  baseline_hrv?: number;
  baseline_sleep?: number;
}

export interface ShapRequest {
  sleep_hours: number;
  hrv: number;
  resting_hr: number;
  duty_hours: number;
  mood_score: number;
  deployment_intensity?: number;
  incident_exposure?: number;
}

export interface RealTimeFrameRequest {
  personnel_id?: string;
  face_detected: boolean;
  eye_aspect_ratio?: number;
  blink_rate_bpm?: number;
  mouth_aspect_ratio?: number;
  brow_tension_raw?: number;
  head_pitch?: number;
  head_yaw?: number;
  head_roll?: number;
  override_emotion?: string;
  override_confidence?: number;
}

export interface RealTimeFrameResponse {
  face_detected: boolean;
  message?: string | null;
  emotion: string;
  emotion_confidence: number;
  emotion_distribution: Record<string, number>;
  eye_closure_percentage: number;
  blink_rate: number;
  is_yawning: boolean;
  head_tilt: { pitch: number; yaw: number; roll: number };
  fatigue_score: number;
  fatigue_level: string;
  facial_tension_score: number;
  attention_score: number;
  attention_level: string;
  estimated_stress_score: number;
  stress_level: string;
  risk_category: string;
  summary_text: string;
  recorded_at: string;
  record_id?: string | null;
}

export interface HistoryItem {
  id: string;
  recorded_at: string;
  personnel_name: string;
  rank: string;
  emotion: string;
  emotion_confidence: number;
  stress_score: number;
  stress_level: string;
  fatigue_score: number;
  fatigue_level: string;
  attention_level: string;
  eye_closure_percentage: number;
  blink_rate: number;
  is_yawning: boolean;
  head_pitch: number;
  head_yaw: number;
  head_roll: number;
  risk_category: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem("sentinelmind_jwt_token");
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem("sentinelmind_jwt_token", token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem("sentinelmind_jwt_token");
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, { ...options, headers });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (err: any) {
      console.warn(`[SentinelMind API Warning] ${endpoint}: ${err.message}`);
      throw err;
    }
  }

  // ============================================================================
  // 1. AUTHENTICATION & SESSION
  // ============================================================================
  async login(formData: URLSearchParams) {
    const res = await fetch(`${API_BASE_URL}/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData,
    });
    if (!responseOk(res)) throw new Error("Authentication failed");
    const data = await res.json();
    this.setToken(data.access_token);
    return data;
  }

  async getCurrentUser() {
    return this.request("/auth/me");
  }

  // ============================================================================
  // 2. PERSONNEL & BASELINE MANAGEMENT (PostgreSQL)
  // ============================================================================
  async getPersonnelRoster(unitId?: string, page = 1, pageSize = 25) {
    const query = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (unitId) query.append("unit_id", unitId);
    return this.request(`/personnel?${query.toString()}`);
  }

  async getPersonnelById(personnelId: string) {
    return this.request(`/personnel/${personnelId}`);
  }

  // ============================================================================
  // 3. STRESS TELEMETRY INGESTION (PostgreSQL + Alert Engine Hook)
  // ============================================================================
  async logTelemetry(payload: TelemetryPayload) {
    return this.request("/stress/logs", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getPersonnelStressHistory(personnelId: string, limit = 50) {
    return this.request(`/stress/personnel/${personnelId}/history?limit=${limit}`);
  }

  async getStressAnalyticsSummary(unitId?: string) {
    const query = unitId ? `?unit_id=${unitId}` : "";
    return this.request(`/stress/analytics/summary${query}`);
  }

  // ============================================================================
  // 4. REAL-TIME FACIAL ANALYSIS (MediaPipe, DeepFace, OpenCV)
  // ============================================================================
  async analyzeRealTimeFrame(payload: RealTimeFrameRequest): Promise<RealTimeFrameResponse> {
    return this.request<RealTimeFrameResponse>("/realtime-analysis/frame", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getAnalysisHistory(personnelId?: string, limit = 50): Promise<HistoryItem[]> {
    const query = new URLSearchParams({ limit: String(limit) });
    if (personnelId) query.append("personnel_id", personnelId);
    return this.request<HistoryItem[]>(`/realtime-analysis/history?${query.toString()}`);
  }

  // ============================================================================
  // 5. ISOLATION FOREST ANOMALY DETECTION
  // ============================================================================
  async detectAnomalies(payload: AnomalyRequest) {
    return this.request("/anomaly/detect", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // ============================================================================
  // 6. SHAP EXPLAINABILITY (XGBOOST FEATURE DECOMPOSITION)
  // ============================================================================
  async explainPrediction(payload: ShapRequest) {
    return this.request("/explain/prediction", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // ============================================================================
  // 7. AUTOMATED ALERT ENGINE (0-30 GREEN, 31-60 AMBER, 61-100 RED)
  // ============================================================================
  async getAlerts(tier?: string, status?: string, page = 1, pageSize = 20) {
    const query = new URLSearchParams({ page: String(page), page_size: String(pageSize) });
    if (tier) query.append("tier", tier);
    if (status) query.append("status_filter", status);
    return this.request(`/alerts?${query.toString()}`);
  }

  async acknowledgeAlert(alertId: string, notes?: string) {
    return this.request(`/alerts/${alertId}/acknowledge`, {
      method: "POST",
      body: JSON.stringify({ notes }),
    });
  }

  async resolveAlert(alertId: string, resolutionNotes: string) {
    return this.request(`/alerts/${alertId}/resolve`, {
      method: "POST",
      body: JSON.stringify({ resolution_notes: resolutionNotes }),
    });
  }
}

function responseOk(res: Response): boolean {
  return res.status >= 200 && res.status < 300;
}

export const api = new ApiClient();
export default api;
