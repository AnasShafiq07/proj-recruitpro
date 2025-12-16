import { API_CONFIG } from "@/config";

const API_BASE_URL = API_CONFIG.BASE_URL;


export interface Department {
  department_id?: number;
  department_name: string;
}

export const departmentApi = {
  // POST /departments/
  async createDepartment(name: string): Promise<Department> {
    const response = await fetch(`${API_BASE_URL}/departments/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`
      },
      body: JSON.stringify({ "department_name": name }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Department adding failed!");
    }

    return await response.json();
  },

  async updateDepartment(name: string, id: number): Promise<Department> {
    const response = await fetch(`${API_BASE_URL}/departments/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`
      },
      body: JSON.stringify({"department_name": name }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Department adding failed!");
    }

    return await response.json();
  },
  async deleteDepartment(id: number): Promise<boolean> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/departments/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`
      },
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Department deletion failed!");
      } catch (e) {
         throw new Error("Department deletion failed!");
      }
    }
    return true; 
  },
 };