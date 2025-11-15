import axiosInstance from "@/utils/axiosInstance";

export const getAllJobs = async () => {
  const response = await axiosInstance.get("/jobs");
  return response.data;
};

export const getJobById = async (id: string) => {
  const response = await axiosInstance.get(`/jobs/${id}`);
  return response.data;
};

export const getJobCandidates = async (id: string) => {
  const response = await axiosInstance.get(`/jobs/${id}/candidates`);
  return response.data;
};

export const createJob = async (data: any) => {
  const response = await axiosInstance.post("/jobs/create", data);
  return response.data;
};
