export type CatalogFlower = {
  id: string;
  name: string;
  type: string | null;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  is_available: boolean;
};

export type CatalogSocialLink = {
  id: string;
  name: string;
  platform: string;
  url: string;
};

export type Catalog = {
  flowers: CatalogFlower[];
  socialLinks: CatalogSocialLink[];
};

export const CATALOG_REPOSITORY_PATH = "public/data/catalog.json";

export function catalogAssetUrl(path: string | null) {
  if (!path) return null;
  if (/^(https?:|blob:|data:)/.test(path)) return path;
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
}

export async function fetchPublishedCatalog(): Promise<Catalog> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/catalog.json`, {
    cache: "no-store",
  });
  if (!response.ok) throw new Error("No se pudo cargar el catálogo");

  const catalog = (await response.json()) as Catalog;
  if (!Array.isArray(catalog.flowers) || !Array.isArray(catalog.socialLinks)) {
    throw new Error("El catálogo publicado no es válido");
  }
  return catalog;
}
