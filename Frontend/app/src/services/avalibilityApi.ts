import { AvailabilityFormData } from "@/components/availability/AvailabilityForm";

const API_BASE_URL = "http://127.0.0.1:8000";

interface AvailabilityResponse {
  id: number;
  hr_id: number;
  days: string[];
  start_time: string;
  end_time: string;
  duration_minutes: number;
  break_minutes: number;
  start_date: string;
  end_date: string;
  created_at: string;
  is_selected?: boolean;
}

export const availabilityApi = {
  // Get all availabilities for the current HR
  async getAll(): Promise<AvailabilityResponse[]> {
    const response = await fetch(`${API_BASE_URL}/availability/`, {
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
      console.log("Successfully fetched availabilities:", data);
      
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
  async getSelected() {
    const response = await fetch(`${API_BASE_URL}/availability/selected-present`, {
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
        return null;
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
      console.log("Successfully fetched availabilities:", data);
      
      console.log(data);
      return data;
    } catch (err) {
      console.error("JSON parsing error:", err);
      throw new Error("Backend returned invalid JSON");
    }
  },

  // Create new availability
  async create(data: AvailabilityFormData): Promise<AvailabilityResponse> {
    const response = await fetch(`${API_BASE_URL}/availability/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to create availability");
    }

    return response.json();
  },

  // Update availability
  async update(
    id: number,
    data: Partial<AvailabilityFormData>
  ): Promise<AvailabilityResponse> {
    const response = await fetch(`${API_BASE_URL}/availability/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to update availability");
    }

    return response.json();
  },

  // Delete availability
  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/availability/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to delete availability");
    }
  },

  // NEW: Select availability
  async select(availability_id: number): Promise<AvailabilityResponse> {
    const response = await fetch(
      `${API_BASE_URL}/availability/select/${availability_id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to select availability");
    }

    return response.json();
  },
};
