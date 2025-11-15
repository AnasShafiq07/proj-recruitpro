import axiosInstance from "@/utils/axiosInstance";

export const login = async (email: string, password: string) => {
  const response = await axiosInstance.post("/auth/login", { email, password });
  return response.data;
};

export const register = async (data: {
  name: string;
  email: string;
  password: string;
  companyName: string;
}) => {
  const response = await axiosInstance.post("/auth/register", data);
  return response.data;
};

export const logout = () => {
  localStorage.removeItem("auth_token");
};
