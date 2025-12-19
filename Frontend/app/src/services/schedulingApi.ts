import { API_CONFIG } from "@/config";

const API_BASE_URL = API_CONFIG.BASE_URL;

export interface SchedulingDetails {
    job_id: number;
    summary?: string;
    description?: string;
} 

export const schedulingApi = {

  async scheduleAll(details: SchedulingDetails) {
    console.log(details);
    const response = await fetch(`${API_BASE_URL}/google/schedule_interviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify(details),
    });

    if (!response.ok) {
      console.error("Response not OK:", response.status, response.statusText);

      if (response.status === 404) {
        console.log("No availabilities found or job not found (404).");
        return [];
      }

      try {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP ${response.status}: Failed to schedule interviews`);
      } catch {
        throw new Error(`HTTP ${response.status}: Failed to schedule interviews`);
      }
    }

    try {
      return await response.json();
    } catch {
      return { success: true };
    }
  },
};