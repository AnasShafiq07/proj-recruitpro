import { API_CONFIG } from "@/config";

const API_BASE_URL = API_CONFIG.BASE_URL;

export interface SlotResponse {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
}

export interface BookSlotRequest {
  candidate_id: number;
  email: string;
}

export interface BookingConfirmation {
  status: string;
  message: string;
  meet_link: string;
}

export interface BulkInvitePayload {
  candidate_ids: number[];
  job_id: number;
  subject?: string;
}

export const schedulingApi = {
  /**
   * HR Only: Generate slots and send invitation emails
   */
  async sendBulkInvites(data: BulkInvitePayload): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/google/send-bulk-invites`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to send bulk invitations");
    }
    return await response.json();
  },

  /**
   * Candidate View: Fetch available slots (Updated with candidateId)
   * The backend now checks if the candidate's link has expired (48h)
   */
  async getAvailableSlots(jobId: number, candidateId: number): Promise<SlotResponse[]> {
    // Note the updated URL path to include candidateId
    const response = await fetch(`${API_BASE_URL}/google/candidates/slots/${jobId}/${candidateId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // If the backend returns 403, it means the link is expired
      throw new Error(errorData.detail || "Failed to fetch available slots");
    }
    return await response.json();
  },

  /**
   * Candidate Action: Book a specific slot
   */
  async bookSlot(slotId: number, data: BookSlotRequest): Promise<BookingConfirmation> {
    const response = await fetch(`${API_BASE_URL}/google/candidates/book/${slotId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "This slot is no longer available.");
    }

    return await response.json();
  },
};