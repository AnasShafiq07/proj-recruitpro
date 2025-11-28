
import type { Department } from "@/utils/types";
import { getJobById } from "./jobService";

const API_BASE_URL = "http://127.0.0.1:8000";

export interface Job {
  job_id: number;
  hr_id: number;
  company_id: number;
  department_id: number;

  title: string;
  description: string;
  requirements: string;

  experience: number | null;
  experience_weight: number;
  skills_weight: number;

  location: string;
  job_type: string | null;
  salary_range: string;

  application_fee: number;
  applicants: number;
  selected: number;
  deadline: string; // from backend: "2025-11-27T05:00:00"
  urgent?: boolean;
  created_at?: string;
  slug: string;
}


export const jobApi = {

  async getJobById(jobId: number): Promise<Job> {
     const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    if (!response.ok) {
      console.error("Response not OK:", response.status, response.statusText);
    }
    return response.json();
  },

    async getAll(): Promise<Job[]> {
      const response = await fetch(`${API_BASE_URL}/jobs/get-all`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    if (!response.ok) {
      console.error("Response not OK:", response.status, response.statusText);
      
      // Handle 404 gracefully - no availabilities exist yet
      if (response.status === 404) {
        console.log("No availabilities found (404) - returning empty array");
        return [];
      }
      
      // Log response body for other errors
      try {
        const errorData = await response.json();
        console.error("Server error response:", errorData);
        throw new Error(errorData.detail || `HTTP ${response.status}: Failed to fetch availabilities`);
      } catch (e) {
        throw new Error(`HTTP ${response.status}: Failed to fetch availabilities`);
      }
    }

    try {
      const data = await response.json();
      
      // Ensure data is an array
      if (!Array.isArray(data)) {
        console.warn("Expected array from API, got:", typeof data);
        return Array.isArray(data) ? data : [];
      }
      
      return data;
    } catch (err) {
      console.error("JSON parsing error:", err);
      throw new Error("Backend returned invalid JSON");
    }
  },

  async getJobsByDepartments(dept_id: number): Promise<Job[]> {
        const response = await fetch(`${API_BASE_URL}/jobs/by-dept/${dept_id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    if (!response.ok) {
      console.error("Response not OK:", response.status, response.statusText);
      
      // Handle 404 gracefully - no availabilities exist yet
      if (response.status === 404) {
        console.log("No availabilities found (404) - returning empty array");
        return [];
      }
      
      // Log response body for other errors
      try {
        const errorData = await response.json();
        console.error("Server error response:", errorData);
        throw new Error(errorData.detail || `HTTP ${response.status}: Failed to fetch availabilities`);
      } catch (e) {
        throw new Error(`HTTP ${response.status}: Failed to fetch availabilities`);
      }
    }

    try {
      const data = await response.json();
      
      // Ensure data is an array
      if (!Array.isArray(data)) {
        console.warn("Expected array from API, got:", typeof data);
        return Array.isArray(data) ? data : [];
      }
      return data;
    } catch (err) {
      console.error("JSON parsing error:", err);
      throw new Error("Backend returned invalid JSON");
    }
  },

  async getDepartments(): Promise<Department[]> {
    const response = await fetch(`${API_BASE_URL}/departments/get/all`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    if (!response.ok) {
      console.error("Response not OK:", response.status, response.statusText);

      if (response.status === 404) {
        console.log("No departments found → returning empty array");
        return [];
      }

      try {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      } catch {
        throw new Error(`HTTP ${response.status}`);
      }
    }

    try {
      const data = await response.json();
      console.log("Successfully fetched departments:", data);

      if (!Array.isArray(data)) {
        console.warn("Expected array from API, got:", typeof data);
        return [];
      }

      return data;
    } catch (err) {
      console.error("JSON parsing error:", err);
      throw new Error("Backend returned invalid JSON");
    }
  },
  
  async update(job_id: number, updatedJob: Partial<Job>): Promise<Job> {
    const response = await fetch(`${API_BASE_URL}/jobs/${job_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify(updatedJob),
    });

    if (!response.ok) {
      console.error("Update failed:", response.status, response.statusText);

      if (response.status === 404) {
        throw new Error("Job not found");
      }

      try {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update job");
      } catch {
        throw new Error("Failed to update job");
      }
    }

    try {
      return await response.json();
    } catch {
      throw new Error("Invalid JSON returned by backend");
    }
  },

  async delete(job_id: number): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/jobs/${job_id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    if (!response.ok) {
      console.error("Delete failed:", response.status, response.statusText);

      if (response.status === 404) {
        throw new Error("Job not found");
      }

      try {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to delete job");
      } catch {
        throw new Error("Failed to delete job");
      }
    }

    return true; // backend returns 204 so success = true
  },

}