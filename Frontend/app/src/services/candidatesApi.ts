const API_BASE_URL = "http://127.0.0.1:8000/candidates";
 // candidatesApi
export interface Candidate {
  candidate_id: number;
  job_id: number;

  name: string;
  email: string;
  phone?: string | null;
  location?: string | null;

  skills?: string | null;       // JSON string or comma list depending on backend
  experience?: string | null;  
  education?: string | null;
  ai_score? : number | null;
  resume_url: string;

  selected_for_interview?: boolean;
  selected?: boolean;
  interview_scheduled?: boolean;
  created_at?: string | null;
  meet_link?: string | null;
}


export const candidateApi = {

  async getTotalApplied(): Promise<Candidate[]> {
    const response = await fetch(`${API_BASE_URL}`, {
      method: "GET", 
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    if(!response.ok) {
      console.error("Error:", response.status, response.statusText);
      return [];
    }
    return await response.json();
  },

  async getAll(job_id: number): Promise<Candidate[]> {
    job_id = 2;
    const response = await fetch(`${API_BASE_URL}/by-job/${job_id}`, {
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

  async getByJob(job_id: number): Promise<Candidate[]> {
    const response = await fetch(`${API_BASE_URL}/filter/selected-for-interview/${job_id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    if (!response.ok) {
      console.error("Error:", response.status, response.statusText);

      if (response.status === 404) return [];
      throw new Error(`Failed to fetch candidates for job ${job_id}`);
    }

    return await response.json();
  },

  async create(data: Partial<Candidate>): Promise<Candidate> {
    const response = await fetch(`${API_BASE_URL}/candidates/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to create candidate");
    }

    return await response.json();
  },

  async update(candidate_id: number, data: Partial<Candidate>): Promise<Candidate> {
    const response = await fetch(`${API_BASE_URL}/candidates/update/${candidate_id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update candidate ${candidate_id}`);
    }

    return await response.json();
  },

  async final_selection(candidate_id: number) {
    const response = await fetch(`${API_BASE_URL}/select/${candidate_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to update candidate ${candidate_id}`);
    }

    return await response.json();
  },
  async de_select(candidate_id: number) {
    const response = await fetch(`${API_BASE_URL}/de-select/${candidate_id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to update candidate ${candidate_id}`);
    }

    return await response.json();
  },

  async delete(candidate_id: number): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/candidates/delete/${candidate_id}`, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    if (!response.ok) return false;
    return true;
  },

  async candidatesWithoutInterview(job_id: number): Promise<Candidate[]> {
    const response = await fetch(`${API_BASE_URL}/candidates/candidates-without-interview/${job_id}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
      },
    });

    if (!response.ok) return [];
    const data = await response.json();
    return data;
  },
};
