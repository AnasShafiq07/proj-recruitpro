import type { Department } from "../utils/types"; // Assuming this is where your types are
import { API_CONFIG } from "@/config";

const API_BASE_URL = API_CONFIG.BASE_URL;

export interface CreateJobPayload {
  department_id: number;
  title: string;
  description?: string;
  requirements?: string;
  job_type?: string;
  location?: string;
  salary_range?: string;
  deadline?: string;
  application_fee?: number;
  skills_weight?: number;
  experience_weight?: number;
  hr_id?: number;
  questions_form?: { questions: { question_text: string }[] };
}

// Interface for LinkedIn Auth Response
export interface LinkedInAuthStatus {
  authenticated: boolean;
}

export const jobApi = {
  // GET /linkedin/auth/status
  async getLinkedInAuthStatus(): Promise<LinkedInAuthStatus> {
    const response = await fetch(`${API_BASE_URL}/linkedin/auth/status`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    if (!response.ok) {
        // If it fails, we assume not authenticated or log error, 
        // but to match previous logic we return the json or throw
        throw new Error("Failed to check LinkedIn status");
    }

    return await response.json();
  },

  // GET /departments/get/all
  async getAllDepartments(): Promise<Department[]> {
    const response = await fetch(`${API_BASE_URL}/departments/get/all`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to fetch departments!");
    }

    return await response.json();
  },

  // POST /jobs/
  async createJob(data: CreateJobPayload): Promise<{ job_link: string }> {
    const response = await fetch(`${API_BASE_URL}/jobs/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to create job");
    }

    return await response.json();
  },
};