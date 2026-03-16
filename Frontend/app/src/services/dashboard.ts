import { API_CONFIG } from "@/config";

const API_BASE_URL = API_CONFIG.BASE_URL;

export interface NextInterview {
  id: number;
  candidate_name: string;
  job_title: string;
  scheduled_time: string;
  meet_link: string;
}

export const dashboardApi = {
  async getNextInterview(): Promise<NextInterview | null> {
    const response = await fetch(`${API_BASE_URL}/dashboard/next-interview`, {
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    if (!response.ok) return null;
    const result = await response.json();
    if (!result || result.data == null) return null;
    return result.data as NextInterview;
  },
};