import api from "./client";
import type { Review, ReviewCreate } from "@/types";

export const reviewsApi = {
  list: (publishedOnly = true) =>
    api.get<Review[]>("/reviews", { params: { published_only: publishedOnly } }).then((r) => r.data),

  adminList: () =>
    api.get<Review[]>("/reviews/admin").then((r) => r.data),

  create: (data: ReviewCreate) =>
    api.post<Review>("/reviews", data).then((r) => r.data),

  update: (id: number, data: Partial<Review>) =>
    api.put<Review>(`/reviews/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/reviews/${id}`).then((r) => r.data),
};
