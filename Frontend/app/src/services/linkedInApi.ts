// linkedinService.ts

const API_BASE_URL = "http://127.0.0.1:8000";

export interface LinkedInAuthStatus {
  authenticated: boolean;
  urn?: string;
  expires_at?: string; // or Date depending on how you want to parse it
  hr_id?: number;
}

export interface LinkedInPostResponse {
  // Define structure based on what create_linkedin_post returns
  // Assumed generic object for now
  id?: string;
  url?: string; 
  message?: string;
}

export const linkedinApi = {

  /**
   * Fetches the LinkedIn OAuth URL. 
   * The component calling this should redirect window.location to the returned URL.
   */
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

  /**
   * Checks if the current HR user has a valid LinkedIn token.
   */
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

  /**
   * Posts a job update to LinkedIn.
   * Uses FormData because the backend endpoint accepts UploadFile and Form data.
   */
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
        // NOTE: Content-Type is NOT set here. 
        // The browser automatically sets it to 'multipart/form-data; boundary=...' when using FormData.
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