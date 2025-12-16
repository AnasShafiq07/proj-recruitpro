import { API_CONFIG } from "@/config";

const API_BASE_URL = API_CONFIG.BASE_URL;

export interface InterviewSchedulePayload {
  candidate_id: number;
  job_id: number;
  email: string;
  summary: string;
  description: string;
  start_time: string;
  end_time: string;
}

export interface GoogleAuthStatus {
  authenticated: boolean;
  email?: string;
}

export interface Answer {
  answer_id: number;
  candidate_id: number;
  question_id: number;
  answer_text: string;
}

export interface CandidateWithAnswers {
  candidate_id: number;
  job_id: number;
  company_id?: number | null;
  name: string;
  email: string;
  phone?: string | null;
  location?: string | null;

  skills?: string | null;
  experience?: string | null;
  education?: string | null;
  
  ai_score?: number | null;
  resume_url: string;
  meet_link?: string | null;

  selected_for_interview?: boolean | null;
  selected?: boolean | null;
  interview_scheduled?: boolean | null;
  created_at?: string | null;

  answers?: Answer[];
}

interface RawBackendResponse {
  candidate: Omit<CandidateWithAnswers, 'answers'>;
  answers: Answer[];
}

export const candidateViewApi = {
  
  // 1. Get Google Auth Status
  async getGoogleAuthStatus(): Promise<GoogleAuthStatus> {
    const response = await fetch(`${API_BASE_URL}/google/auth/status`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });

    if (!response.ok) {
        // Fallback to false if endpoint fails/404s to prevent UI crash
        console.warn("Failed to check google auth status");
        return { authenticated: false };
    }
    return response.json();
  },

  async getCandidateById(id: string | number): Promise<CandidateWithAnswers> {
    const response = await fetch(`${API_BASE_URL}/candidates/${id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch candidate: ${response.statusText}`);
    }
    const rawData: RawBackendResponse = await response.json();

    const mappedData: CandidateWithAnswers = {
      ...rawData.candidate, 
      answers: rawData.answers 
    };

    return mappedData;
  },

  // 3. Schedule Interview
  async scheduleInterview(data: InterviewSchedulePayload): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/google/create_event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to schedule interview');
    }
    return response.json();
  },

  // 4. Update Candidate Status (Generic PATCH)
  async updateStatus(id: number, data: Record<string, any>): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/candidates/update/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to update status');
    }
    return response.json();
  },

  // 5. Get Resume Blob
  async getResumeBlob(resumeUrl: string): Promise<{ url: string; blob: Blob }> {
    const fetchUrl = resumeUrl.startsWith('http') ? resumeUrl : `${API_BASE_URL}${resumeUrl}`;

    const res = await fetch(fetchUrl, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => null);
      throw new Error(`Failed to fetch resume (${res.status}) ${text || ''}`);
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    return { url, blob };
  }
};