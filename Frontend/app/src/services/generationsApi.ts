const API_BASE_URL = "http://127.0.0.1:8000/generate";

export interface PromptRequest {
  prompt: string;
}

export interface GenerationResponse {
  caption: string;
  image_base64: string;
}

export const generationApi = {

  /**
   * Generates a LinkedIn post image and caption.
   * Calls: POST /generate/linkedin_post
   */
  async generateLinkedinPost(data: PromptRequest): Promise<GenerationResponse> {
    const response = await fetch(`${API_BASE_URL}/linkedin_post`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Error:", response.status, response.statusText);
      throw new Error(errorData.detail || "Failed to generate LinkedIn post");
    }

    return await response.json();
  },

  /**
   * Triggers the send offer letter logic.
   * Calls: POST /generate/send-offer-letter
   */
  async sendOfferLetter(data: PromptRequest): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/send-offer-letter`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Error:", response.status, response.statusText);
      throw new Error(errorData.detail || "Failed to send offer letter");
    }

    return await response.json();
  },
};