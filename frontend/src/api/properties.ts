import api from "./client";
import type { Property, PropertiesResponse, PropertyFilters } from "@/types";

export const propertiesApi = {
  list: (filters: PropertyFilters = {}) =>
    api.get<PropertiesResponse>("/properties", { params: filters }).then((r) => r.data),

  featured: (limit = 6) =>
    api.get<Property[]>("/properties/featured", { params: { limit } }).then((r) => r.data),

  adminList: (params: { search?: string; limit?: number; skip?: number } = {}) =>
    api.get<PropertiesResponse>("/properties/admin/all", { params }).then((r) => r.data),

  adminGet: (id: number) =>
    api.get<Property>(`/properties/admin/${id}`).then((r) => r.data),

  getBySlug: (slug: string) =>
    api.get<Property>(`/properties/${slug}`).then((r) => r.data),

  create: (data: Partial<Property>) =>
    api.post<Property>("/properties", data).then((r) => r.data),

  update: (id: number, data: Partial<Property>) =>
    api.put<Property>(`/properties/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/properties/${id}`).then((r) => r.data),

  uploadImage: (propertyId: number, file: File, sortOrder = 0) => {
    const form = new FormData();
    form.append("file", file);
    form.append("sort_order", String(sortOrder));
    return api.post(`/properties/${propertyId}/images`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);
  },

  deleteImage: (propertyId: number, imageId: number) =>
    api.delete(`/properties/${propertyId}/images/${imageId}`).then((r) => r.data),

  reorderImages: (propertyId: number, order: number[]) =>
    api.put(`/properties/${propertyId}/images/reorder`, order).then((r) => r.data),

  parseCian: (url: string) =>
    api.post<{ id: number; slug: string; title: string; photos: number }>(
      "/properties/parse-cian",
      { url },
      { timeout: 120_000 }
    ).then((r) => r.data),
};
