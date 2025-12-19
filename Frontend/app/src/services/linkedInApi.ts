
import { API_CONFIG } from "@/config";

const API_BASE_URL = API_CONFIG.BASE_URL;
export interface LinkedInAuthStatus {
  authenticated: boolean;
  urn?: string;
  expires_at?: string; 
  hr_id?: number;
}

export interface LinkedInPostResponse {
  id?: string;
  url?: string; 
  message?: string;
}

export const linkedinApi = {

  async getAuthUrl(): Promise<string> {
    const response = await fetch(`${API_BASE_URL}/linkedin/auth/login`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    if (!response.ok) {
      console.error("LinkedIn Auth Init Failed:", response.status, response.statusText);
      try {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to initiate LinkedIn login");
      } catch {
        throw new Error(`HTTP ${response.status}: Failed to initiate LinkedIn login`);
      }
    }

    try {
      const data = await response.json();
      return data.redirect_url;
    } catch (err) {
      console.error("JSON parsing error:", err);
      throw new Error("Backend returned invalid JSON");
    }
  },

  async getAuthStatus(): Promise<LinkedInAuthStatus> {
    const response = await fetch(`${API_BASE_URL}/linkedin/auth/status`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    if (!response.ok) {
      console.error("Status Check Failed:", response.status, response.statusText);
      try {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to fetch LinkedIn status");
      } catch {
        throw new Error(`HTTP ${response.status}: Failed to fetch status`);
      }
    }

    try {
      return await response.json();
    } catch (err) {
      console.error("JSON parsing error:", err);
      throw new Error("Backend returned invalid JSON");
    }
  },

  async createPost(caption: string, applyLink: string, image: File | null): Promise<LinkedInPostResponse> {
    const formData = new FormData();
    formData.append("caption", caption);
    formData.append("apply_link", applyLink);
    
    if (image) {
      formData.append("image", image);
    }

    const response = await fetch(`${API_BASE_URL}/linkedin/post/`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: formData,
    });

    if (!response.ok) {
      console.error("LinkedIn Post Failed:", response.status, response.statusText);
      try {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create LinkedIn post");
      } catch {
        throw new Error(`HTTP ${response.status}: Failed to create LinkedIn post`);
      }
    }

    try {
      return await response.json();
    } catch (err) {
      console.error("JSON parsing error:", err);
      throw new Error("Backend returned invalid JSON");
    }
  },
};