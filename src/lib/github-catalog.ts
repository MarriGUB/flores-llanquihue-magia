import { CATALOG_REPOSITORY_PATH, type Catalog } from "@/lib/catalog";

const API_ROOT = "https://api.github.com";
const OWNER = "MarriGUB";
const REPOSITORY = "flores-llanquihue-magia";
const BRANCH = "main";

type GithubContent = {
  content: string;
  encoding: string;
  sha: string;
};

type GithubRepository = {
  full_name: string;
  permissions?: {
    push: boolean;
  };
};

type GithubErrorPayload = {
  message?: string;
};

function encodePath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function textToBase64(value: string) {
  return bytesToBase64(new TextEncoder().encode(value));
}

function base64ToText(value: string) {
  const binary = atob(value.replace(/\n/g, ""));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function githubRequest<T>(token: string, path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_ROOT}${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as GithubErrorPayload;
    const detail = payload.message ? `: ${payload.message}` : "";
    if (response.status === 401) {
      throw new Error("El token no es válido o venció");
    }
    if (response.status === 403) {
      throw new Error("El token no tiene permiso para guardar en el repositorio");
    }
    if (response.status === 409) {
      throw new Error("El catálogo cambió. Recárgalo antes de guardar nuevamente");
    }
    throw new Error(`GitHub rechazó la operación${detail}`);
  }

  return (await response.json()) as T;
}

export async function verifyGithubToken(token: string) {
  const repository = await githubRequest<GithubRepository>(token, `/repos/${OWNER}/${REPOSITORY}`);
  if (!repository.permissions?.push) {
    throw new Error("El token necesita permiso Contents: Read and write para este repositorio");
  }
  return repository.full_name;
}

export async function loadGithubCatalog(token: string) {
  const file = await githubRequest<GithubContent>(
    token,
    `/repos/${OWNER}/${REPOSITORY}/contents/${encodePath(CATALOG_REPOSITORY_PATH)}?ref=${BRANCH}`,
  );
  if (file.encoding !== "base64") {
    throw new Error("GitHub entregó el catálogo en un formato desconocido");
  }

  return {
    catalog: JSON.parse(base64ToText(file.content)) as Catalog,
    sha: file.sha,
  };
}

export async function saveGithubCatalog(
  token: string,
  catalog: Catalog,
  sha: string,
  message: string,
) {
  const result = await githubRequest<{ content: GithubContent }>(
    token,
    `/repos/${OWNER}/${REPOSITORY}/contents/${encodePath(CATALOG_REPOSITORY_PATH)}`,
    {
      method: "PUT",
      body: JSON.stringify({
        message,
        content: textToBase64(`${JSON.stringify(catalog, null, 2)}\n`),
        sha,
        branch: BRANCH,
      }),
    },
  );
  return result.content.sha;
}

export async function uploadGithubImage(token: string, repositoryPath: string, image: Blob) {
  const bytes = new Uint8Array(await image.arrayBuffer());
  await githubRequest<{ content: GithubContent }>(
    token,
    `/repos/${OWNER}/${REPOSITORY}/contents/${encodePath(repositoryPath)}`,
    {
      method: "PUT",
      body: JSON.stringify({
        message: "Agregar imagen al catálogo",
        content: bytesToBase64(bytes),
        branch: BRANCH,
      }),
    },
  );
}
