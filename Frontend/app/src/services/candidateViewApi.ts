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
  interviewed: any;
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

export interface OfferLetterPayload {
  // Required candidate details
  name: string;
  designation: string;
  salary: string;
  
  // Logistics
  start_date: string; // Use string to handle ISO format or "YYYY-MM-DD"
  expiry_date?: string; // Optional: When the offer expires
  
  // Perks and Details
  joining_bonus?: string;
  reporting_to?: string;
  location?: string;
  
  // The specific template ID to use (from your Google Drive)
  google_doc_id: string; 
}

export const candidateViewApi = {
  
  async getGoogleAuthStatus(): Promise<GoogleAuthStatus> {
    const response = await fetch(`${API_BASE_URL}/google/auth/status`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });

    if (!response.ok) {
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
    console.log("mapped data",mappedData.resume_url);
    return mappedData;
  },

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

  async updateStatus(id: number, data: Record<string, any>): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/candidates/${id}`, {
      method: 'PUT',
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
  },

  async sendOfferLetter(candidateId: number, data: {
    salary: string;
    perks: string;
    other_details: string;
  }): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/candidates/${candidateId}/send-offer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to send offer letter');
    }
    return response.json();
  },

  async selectForInterview(candidateId: number): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/candidates/select-for-interview/${candidateId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to select candidate for interview');
    }
    return response.json();
  },

  async uploadOfferTemplate(file: File): Promise<{
    view_link: string; google_doc_id: string; message: string 
}> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/google/upload-template`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        // Do NOT set 'Content-Type' here, the browser sets it for FormData
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to upload template');
    }
    return response.json();
  },
  async getOfferTemplate(): Promise<{ google_doc_id: string; view_link: string }> {
  const response = await fetch(`${API_BASE_URL}/google/offer-template`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to fetch template');
  }
  return response.json();
  },

 async generateAndSendOffer(candidateId: number, candidateEmail: string, replacements: Record<string, string>): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/google/send-offer-letter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify({
        candidate_id: candidateId,
        candidate_email: candidateEmail,
        replacements: replacements, // e.g., {"{{salary}}": "50,000", "{{role}}": "Backend Dev"}
        subject: "Your Official Offer Letter from RecruitPro"
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to process and send offer letter');
    }
    return response.json();
}
};