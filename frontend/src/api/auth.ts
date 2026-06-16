import api from "./client";
import type { TokenResponse, User } from "@/types";

export const authApi = {
  login: (email: string, password: string) =>
    api.post<TokenResponse>("/auth/login", { email, password }).then((r) => r.data),

  me: () =>
    api.get<User>("/auth/me").then((r) => r.data),
};
