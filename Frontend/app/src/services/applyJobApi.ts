import { API_CONFIG } from "@/config";


export interface Question {
  question_id: number;
  question_text: string;
}

export interface Job {
  job_id: number;
  company_id: number;
  title: string;
  description?: string;
  requirements?: string;
  location?: string;
  salary_range?: string;
  deadline?: string;
  application_fee?: number;
  department_id?: number;
}

export interface JobResponse {
  job: Job;
  questions: Question[];
}

export interface CandidatePayload {
  job_id: number;
  company_id: number;
  name: string;
  email: string;
  phone?: string;
  location?: string;
  skills?: string;
  experience?: string;
  education?: string;
  resume_url?: string;
  answers: {
    question_id: number;
    answer_text: string;
  }[];
}

export interface ResumeUploadResponse {
  url?: string;
  file_url?: string;
}


export const applicationApi = {
  async getJobBySlug(slug: string, signal?: AbortSignal): Promise<JobResponse> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/jobs/url/${slug}`, {
      method: "GET",
      signal,
    });

    if (!response.ok) {
      throw new Error("Job not found");
    }
    return await response.json();
  },

  async uploadResume(file: File): Promise<ResumeUploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_CONFIG.BASE_URL}/upload/resume`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Failed to upload resume");
    }
    return await response.json();
  },

  async submitApplication(data: CandidatePayload): Promise<any> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/candidates/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.detail || "Failed to submit application");
    }
    return await response.json();
  },
};