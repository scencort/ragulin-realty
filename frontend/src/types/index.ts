export type PropertyType =
  | "apartment"
  | "house"
  | "commercial"
  | "land"
  | "garage"
  | "townhouse";

export interface PropertyImage {
  id: number;
  property_id: number;
  image_path: string;
  sort_order: number;
}

export interface Property {
  id: number;
  title: string;
  slug: string;
  property_type: PropertyType;
  status: string;
  price: number;
  area: number;
  rooms: number | null;
  floor: number | null;
  total_floors: number | null;
  address: string;
  district: string;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  advantages: string[] | null;
  renovation: string | null;
  year_built: number | null;
  cian_url: string | null;
  is_featured: number;
  created_at: string;
  updated_at: string;
  images: PropertyImage[];
}

export interface PropertiesResponse {
  items: Property[];
  total: number;
  skip: number;
  limit: number;
}

export interface PropertyFilters {
  property_type?: PropertyType;
  district?: string;
  rooms?: number;
  price_min?: number;
  price_max?: number;
  area_min?: number;
  area_max?: number;
  skip?: number;
  limit?: number;
}

export interface Review {
  id: number;
  client_name: string;
  text: string;
  rating: number;
  is_published: boolean;
  created_at: string;
}

export interface ReviewCreate {
  client_name: string;
  text: string;
  rating: number;
}

export interface SEOPage {
  id: number;
  page: string;
  meta_title: string | null;
  meta_description: string | null;
  og_title: string | null;
  og_description: string | null;
  og_image: string | null;
  updated_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: number;
  email: string;
  role: string;
}

export const PROPERTY_STATUS_LABELS: Record<string, string> = {
  sale:   "На продажу",
  rent:   "Аренда",
  sold:   "Продано",
  rented: "Сдано",
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  apartment: "Квартира",
  house: "Дом",
  commercial: "Коммерческая",
  land: "Земельный участок",
  garage: "Гараж",
  townhouse: "Таунхаус",
};

export const DISTRICT_OPTIONS = [
  "Арбат", "Балтийский", "Басманный", "Беговой", "Замоскворечье",
  "Красносельский", "Крылатское", "Кунцево", "Кутузовский", "Митино",
  "Нагатино", "Новогиреево", "Останкинский", "Пресненский", "Раменки",
  "Северное Тушино", "Сокольники", "Строгино", "Таганский", "Тверской",
  "Фили", "Хамовники", "Хорошёво-Мнёвники", "Щукино", "Якиманка",
];
