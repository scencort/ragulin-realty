import api from "./client";
import type { SEOPage } from "@/types";

export const seoApi = {
  get: (page: string) =>
    api.get<SEOPage>(`/seo/${page}`).then((r) => r.data).catch(() => null),

  list: () =>
    api.get<SEOPage[]>("/seo").then((r) => r.data),

  update: (page: string, data: Partial<SEOPage>) =>
    api.put<SEOPage>(`/seo/${page}`, data).then((r) => r.data),
};
