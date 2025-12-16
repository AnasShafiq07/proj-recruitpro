import { API_CONFIG } from "@/config";

const API_BASE_URL = API_CONFIG.BASE_URL;

export interface HRManager {
  id: number;
  name: string;
  email: string;
  role: string;
  password: string | null;
  company_id?: number | null;
  created_at?: string; 
}

export const hrManagerApi = {
  // GET /hr-managers/curr-hr
  async getCurrentHR(): Promise<HRManager> {
    const response = await fetch(`${API_BASE_URL}/hr-managers/curr-hr`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch current HR details");
    }

    return await response.json();
  },

  // GET /hr-managers/
  async getAll(): Promise<HRManager[]> {
    const response = await fetch(`${API_BASE_URL}/hr-managers/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    if (!response.ok) {
      console.error("Error:", response.status, response.statusText);
      return [];
    }

    return await response.json();
  },

  // GET /hr-managers/{hr_id}
  async getById(hr_id: number): Promise<HRManager> {
    const response = await fetch(`${API_BASE_URL}/hr-managers/${hr_id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("HR Manager not found");
      }
      throw new Error(`Failed to fetch HR Manager ${hr_id}`);
    }

    return await response.json();
  },

  // POST /hr-managers/
  async createAdmin(data: Partial<HRManager>): Promise<HRManager> {
    const response = await fetch(`${API_BASE_URL}/hr-managers/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to create HR Manager");
    }

    return await response.json();
  },

  async createHr(data: Partial<HRManager>): Promise<HRManager> {
    console.log(data);
    const response = await fetch(`${API_BASE_URL}/auth/hr/create-new/`, {
      method: "POST",
      headers: {
        "Content-Type" : "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to create HR Manager");
    }
    return await response.json();
  },

  // PUT /hr-managers/{hr_id}
  async update(hr_id: number, data: Partial<HRManager>): Promise<HRManager> {
    const response = await fetch(`${API_BASE_URL}/hr-managers/${hr_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update HR Manager ${hr_id}`);
    }

    return await response.json();
  },

  // DELETE /hr-managers/{hr_id}
  async delete(hr_id: number): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/hr-managers/${hr_id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    if (!response.ok) return false;
    return true;
  },
};