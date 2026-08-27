import api from "./api";

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  created_at?: string;
}

export const registerUser = async (data: RegisterData) => {
  const response = await api.post("/auth/register", data);
  return response.data;
};

export const loginUser = async (data: LoginData) => {
  const response = await api.post("/auth/login", data);
  return response.data;
};

export const getMe = async (): Promise<User> => {
  const response = await api.get("/auth/me");

  return response.data.data.user;
};

export const logoutUser = async () => {
  const response = await api.post("/auth/logout");

  return response.data;
};