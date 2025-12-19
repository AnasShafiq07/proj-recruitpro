import { API_CONFIG } from "@/config";

const API_BASE_URL = API_CONFIG.BASE_URL;

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface CompanySignupResponse {
  company_id: number;
  message?: string;
}

export interface AdminSignupPayload {
  name: string;
  email: string;
  role: "admin";
  password: string;
  company_id: number;
}

export const authApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const response = await fetch(`${API_BASE_URL}/auth/hr/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Login failed");
    }
    return await response.json();
  },

  async checkEmailAvailability(email: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/auth/check-email?email=${email}`);
    return await response.json();
  },

  async createCompany(name: string): Promise<CompanySignupResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/company/signup/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Company signup failed");
    }
    return await response.json();
  },

  async registerAdmin(data: AdminSignupPayload): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/admin/signup/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "HR signup failed");
    }
    return await response.json();
  },
};