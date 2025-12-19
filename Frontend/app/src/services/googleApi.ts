import { API_CONFIG } from "@/config";


export interface GoogleAuthStatus {
  authenticated: boolean;
  expires_at?: string;
  hr_id?: number;
}

export interface GoogleLoginResponse {
  redirect_url: string;
}


export const googleApi = {
  async getStatus(): Promise<GoogleAuthStatus> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/google/auth/status`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    if (!response.ok) {
      return { authenticated: false };
    }

    return await response.json();
  },

  async initiateLogin(): Promise<GoogleLoginResponse> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/google/auth/login`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to initiate Google login");
    }

    return await response.json();
  },
};