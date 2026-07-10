import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ExternalLink,
  Flower2,
  KeyRound,
  LogOut,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  catalogAssetUrl,
  type Catalog,
  type CatalogFlower,
  type CatalogSocialLink,
} from "@/lib/catalog";
import {
  loadGithubCatalog,
  saveGithubCatalog,
  uploadGithubImage,
  verifyGithubToken,
} from "@/lib/github-catalog";
import { SocialIcon, SOCIAL_PLATFORM_OPTIONS } from "@/lib/social-icons";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

const TOKEN_STORAGE_KEY = "flores-github-token";
const TOKEN_HELP_URL = "https://github.com/settings/personal-access-tokens/new";

function readStoredToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(TOKEN_STORAGE_KEY) ?? "";
}

function AdminPage() {
  const [token, setToken] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setToken(readStoredToken());
    setReady(true);
  }, []);

  const signOut = () => {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken("");
  };

  if (!ready) return <FullPageMsg text="Cargando..." />;
  if (!token) return <TokenGate onAuthenticated={setToken} />;
  return <AdminDashboard token={token} onSignOut={signOut} onInvalidToken={signOut} />;
}

function TokenGate({ onAuthenticated }: { onAuthenticated: (token: string) => void }) {
  const [value, setValue] = useState("");
  const [checking, setChecking] = useState(false);

  const connect = async () => {
    const trimmed = value.trim();
    if (!trimmed) {
      toast.error("Pega tu token de GitHub");
      return;
    }
    setChecking(true);
    try {
      await verifyGithubToken(trimmed);
      window.localStorage.setItem(TOKEN_STORAGE_KEY, trimmed);
      onAuthenticated(trimmed);
      toast.success("Conectado a GitHub");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo conectar");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div
        className="flex items-center justify-center px-4 py-16"
        style={{ background: "var(--gradient-bloom)" }}
      >
        <Card className="w-full max-w-lg shadow-[var(--shadow-soft)]">
          <CardContent className="space-y-5 py-8">
            <div className="text-center">
              <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <KeyRound className="h-7 w-7" />
              </span>
              <h1 className="font-display text-2xl text-foreground">Panel de administración</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Conecta tu cuenta de GitHub para guardar el catálogo. Es gratis y no necesitas
                encender ningún servidor.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="github-token">Token de GitHub</Label>
              <Input
                id="github-token"
                type="password"
                value={value}
                placeholder="github_pat_..."
                onChange={(event) => setValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") connect();
                }}
              />
            </div>

            <Button className="w-full" onClick={connect} disabled={checking}>
              {checking ? "Conectando..." : "Conectar"}
            </Button>

            <div className="rounded-lg border border-border/70 bg-muted/40 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">¿Cómo obtengo el token?</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>Abre la página de tokens de GitHub.</li>
                <li>
                  En <strong>Repository access</strong> elige solo{" "}
                  <strong>flores-llanquihue-magia</strong>.
                </li>
                <li>
                  En <strong>Permissions → Contents</strong> selecciona{" "}
                  <strong>Read and write</strong>.
                </li>
                <li>Crea el token, cópialo y pégalo aquí arriba.</li>
              </ol>
              <a
                href={TOKEN_HELP_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-primary hover:underline"
              >
                Crear token en GitHub <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AdminDashboard({
  token,
  onSignOut,
  onInvalidToken,
}: {
  token: string;
  onSignOut: () => void;
  onInvalidToken: () => void;
}) {
  const qc = useQueryClient();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [sha, setSha] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["github-catalog"],
    queryFn: () => loadGithubCatalog(token),
    retry: false,
  });

  useEffect(() => {
    if (data) {
      setCatalog(data.catalog);
      setSha(data.sha);
    }
  }, [data]);

  useEffect(() => {
    if (error instanceof Error && error.message.includes("token")) {
      toast.error(error.message);
      onInvalidToken();
    }
  }, [error, onInvalidToken]);

  const persist = async (next: Catalog, message: string) => {
    if (sha === null) return;
    setSaving(true);
    try {
      const nextSha = await saveGithubCatalog(token, next, sha, message);
      setCatalog(next);
      setSha(nextSha);
      qc.invalidateQueries({ queryKey: ["published-catalog"] });
      toast.success("Cambios publicados. Se verán en unos minutos.");
    } catch (saveError) {
      toast.error(saveError instanceof Error ? saveError.message : "Error guardando");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !catalog || sha === null) {
    return <FullPageMsg text="Cargando catálogo..." />;
  }

  const flowers = catalog.flowers;
  const socialLinks = catalog.socialLinks;

  const saveFlower = (flower: CatalogFlower) => {
    const exists = flowers.some((item) => item.id === flower.id);
    const nextFlowers = exists
      ? flowers.map((item) => (item.id === flower.id ? flower : item))
      : [flower, ...flowers];
    return persist({ ...catalog, flowers: nextFlowers }, `Actualizar flor: ${flower.name}`);
  };

  const removeFlower = (flower: CatalogFlower) => {
    if (!confirm(`¿Eliminar "${flower.name}"?`)) return;
    void persist(
      { ...catalog, flowers: flowers.filter((item) => item.id !== flower.id) },
      `Eliminar flor: ${flower.name}`,
    );
  };

  const toggleFlower = (flower: CatalogFlower) => {
    void saveFlower({ ...flower, is_available: !flower.is_available });
  };

  const saveSocialLink = (link: CatalogSocialLink) => {
    const exists = socialLinks.some((item) => item.id === link.id);
    const nextLinks = exists
      ? socialLinks.map((item) => (item.id === link.id ? link : item))
      : [...socialLinks, link];
    return persist({ ...catalog, socialLinks: nextLinks }, `Actualizar red social: ${link.name}`);
  };

  const removeSocialLink = (link: CatalogSocialLink) => {
    if (!confirm(`¿Eliminar "${link.name}"?`)) return;
    void persist(
      { ...catalog, socialLinks: socialLinks.filter((item) => item.id !== link.id) },
      `Eliminar red social: ${link.name}`,
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl text-foreground">Panel de administración</h1>
            <p className="text-sm text-muted-foreground">
              Agrega, edita o marca como agotadas las flores del catálogo.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <FlowerDialog token={token} onSave={saveFlower} disabled={saving}>
              <Button>
                <Plus className="mr-1.5 h-4 w-4" /> Nueva flor
              </Button>
            </FlowerDialog>
            <Button variant="outline" onClick={onSignOut}>
              <LogOut className="mr-1.5 h-4 w-4" /> Salir
            </Button>
          </div>
        </div>

        {flowers.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-14 text-center">
              <Flower2 className="mx-auto mb-3 h-10 w-10 text-primary" />
              <p className="font-display text-xl">Aún no hay flores</p>
              <p className="text-sm text-muted-foreground">
                Agrega la primera con el botón de arriba.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {flowers.map((flower) => (
              <AdminFlowerCard
                key={flower.id}
                flower={flower}
                token={token}
                disabled={saving}
                onSave={saveFlower}
                onToggle={toggleFlower}
                onRemove={removeFlower}
              />
            ))}
          </div>
        )}

        <div className="mt-16">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-3xl text-foreground">Redes sociales</h2>
              <p className="text-sm text-muted-foreground">
                Agrega los enlaces que aparecerán en la página.
              </p>
            </div>
            <SocialLinkDialog onSave={saveSocialLink} disabled={saving}>
              <Button>
                <Plus className="mr-1.5 h-4 w-4" /> Agregar red social
              </Button>
            </SocialLinkDialog>
          </div>

          {socialLinks.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-14 text-center">
                <Flower2 className="mx-auto mb-3 h-10 w-10 text-primary" />
                <p className="font-display text-xl">Aún no hay redes sociales</p>
                <p className="text-sm text-muted-foreground">
                  Añade la primera para mostrarla en la página.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {socialLinks.map((link) => (
                <AdminSocialLinkCard
                  key={link.id}
                  link={link}
                  disabled={saving}
                  onSave={saveSocialLink}
                  onRemove={removeSocialLink}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FullPageMsg({ text }: { text: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
      {text}
    </div>
  );
}

function AdminFlowerCard({
  flower,
  token,
  disabled,
  onSave,
  onToggle,
  onRemove,
}: {
  flower: CatalogFlower;
  token: string;
  disabled: boolean;
  onSave: (flower: CatalogFlower) => Promise<void>;
  onToggle: (flower: CatalogFlower) => void;
  onRemove: (flower: CatalogFlower) => void;
}) {
  const [hasImageError, setHasImageError] = useState(false);
  const imageUrl = catalogAssetUrl(flower.image_url);

  return (
    <Card className="overflow-hidden shadow-[var(--shadow-soft)]">
      <div className="relative aspect-square bg-muted">
        {imageUrl && !hasImageError ? (
          <img
            src={imageUrl}
            alt={flower.name}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setHasImageError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Flower2 className="h-16 w-16 text-primary/40" />
          </div>
        )}
        {(!flower.is_available || flower.stock <= 0) && (
          <Badge variant="destructive" className="absolute right-2 top-2">
            Agotada
          </Badge>
        )}
      </div>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-lg">{flower.name}</h3>
            {flower.type && <p className="text-xs text-muted-foreground">{flower.type}</p>}
          </div>
          <p className="font-display text-primary">
            ${Number(flower.price).toLocaleString("es-CL")}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">Stock: {flower.stock}</p>
        <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
          <div className="flex items-center gap-2">
            <Switch
              checked={flower.is_available}
              onCheckedChange={() => onToggle(flower)}
              disabled={disabled}
              id={`av-${flower.id}`}
            />
            <Label htmlFor={`av-${flower.id}`} className="text-xs">
              Disponible
            </Label>
          </div>
          <div className="flex gap-1">
            <FlowerDialog token={token} flower={flower} onSave={onSave} disabled={disabled}>
              <Button size="icon" variant="ghost">
                <Pencil className="h-4 w-4" />
              </Button>
            </FlowerDialog>
            <Button
              size="icon"
              variant="ghost"
              disabled={disabled}
              onClick={() => onRemove(flower)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminSocialLinkCard({
  link,
  disabled,
  onSave,
  onRemove,
}: {
  link: CatalogSocialLink;
  disabled: boolean;
  onSave: (link: CatalogSocialLink) => Promise<void>;
  onRemove: (link: CatalogSocialLink) => void;
}) {
  return (
    <Card className="overflow-hidden shadow-[var(--shadow-soft)]">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <SocialIcon platform={link.platform} className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-lg text-foreground truncate">{link.name}</h3>
            <p className="text-xs text-muted-foreground truncate">{link.platform}</p>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <a
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border border-border px-3 py-2 text-sm text-primary transition hover:bg-primary/5"
          >
            Ver enlace
          </a>
          <div className="flex items-center justify-between gap-2">
            <SocialLinkDialog socialLink={link} onSave={onSave} disabled={disabled}>
              <Button size="icon" variant="ghost">
                <Pencil className="h-4 w-4" />
              </Button>
            </SocialLinkDialog>
            <Button size="icon" variant="ghost" disabled={disabled} onClick={() => onRemove(link)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SocialLinkDialog({
  children,
  socialLink,
  disabled,
  onSave,
}: {
  children: React.ReactNode;
  socialLink?: CatalogSocialLink;
  disabled: boolean;
  onSave: (link: CatalogSocialLink) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(socialLink?.name ?? "");
  const [platform, setPlatform] = useState(socialLink?.platform ?? "instagram");
  const [url, setUrl] = useState(socialLink?.url ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(socialLink?.name ?? "");
    setPlatform(socialLink?.platform ?? "instagram");
    setUrl(socialLink?.url ?? "");
  }, [open, socialLink]);

  const save = async () => {
    if (!name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (!url.trim()) {
      toast.error("La URL es obligatoria");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        id: socialLink?.id ?? crypto.randomUUID(),
        name: name.trim(),
        platform: platform.trim(),
        url: url.trim(),
      });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {socialLink ? "Editar red social" : "Nuevo enlace social"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Nombre</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div>
            <Label>Plataforma</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona una plataforma" />
              </SelectTrigger>
              <SelectContent>
                {SOCIAL_PLATFORM_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>URL</Label>
            <Input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={saving || disabled}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

async function resizeImage(file: File, maxSize = 1200): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * ratio);
  const height = Math.round(bitmap.height * ratio);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return file;
  context.drawImage(bitmap, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.8),
  );
  return blob ?? file;
}

function FlowerDialog({
  children,
  token,
  flower,
  disabled,
  onSave,
}: {
  children: React.ReactNode;
  token: string;
  flower?: CatalogFlower;
  disabled: boolean;
  onSave: (flower: CatalogFlower) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [stock, setStock] = useState("1");
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(flower?.name ?? "");
    setType(flower?.type ?? "");
    setDescription(flower?.description ?? "");
    setPrice(flower?.price?.toString() ?? "0");
    setStock(flower?.stock?.toString() ?? "1");
    setImagePath(flower?.image_url ?? null);
    setPreviewUrl(catalogAssetUrl(flower?.image_url ?? null));
  }, [open, flower]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const upload = async (file: File) => {
    setPreviewUrl(URL.createObjectURL(file));
    setUploading(true);
    try {
      const image = await resizeImage(file, 1200);
      const repositoryPath = `public/data/images/${crypto.randomUUID()}.jpg`;
      await uploadGithubImage(token, repositoryPath, image);
      const publicPath = repositoryPath.replace(/^public\//, "");
      setImagePath(publicPath);
      setPreviewUrl(catalogAssetUrl(publicPath));
      toast.success("Imagen subida");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al subir la imagen");
      setPreviewUrl(catalogAssetUrl(imagePath));
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    if (!imagePath) {
      toast.error("Sube una foto para la flor antes de guardar");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        id: flower?.id ?? crypto.randomUUID(),
        name: name.trim(),
        type: type.trim() || null,
        description: description.trim() || null,
        price: parseFloat(price) || 0,
        stock: parseInt(stock, 10) || 0,
        image_url: imagePath,
        is_available: flower?.is_available ?? true,
      });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">
            {flower ? "Editar flor" : "Nueva flor"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Foto</Label>
            <div className="mt-1.5 flex items-center gap-3">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="preview"
                  className="h-16 w-16 rounded-md object-cover"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <Flower2 className="h-8 w-8" />
                </div>
              )}
              <label className="flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent">
                <Upload className="h-4 w-4" />
                {uploading ? "Subiendo..." : imagePath ? "Cambiar" : "Subir imagen"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => event.target.files?.[0] && upload(event.target.files[0])}
                />
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nombre</Label>
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div>
              <Label>Tipo</Label>
              <Input
                value={type}
                onChange={(event) => setType(event.target.value)}
                placeholder="Rosa, Girasol..."
              />
            </div>
          </div>
          <div>
            <Label>Descripción</Label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Precio (CLP)</Label>
              <Input
                type="number"
                value={price}
                onChange={(event) => setPrice(event.target.value)}
              />
            </div>
            <div>
              <Label>Cantidad disponible</Label>
              <Input
                type="number"
                value={stock}
                onChange={(event) => setStock(event.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={saving || uploading || disabled}>
            {uploading ? "Subiendo..." : saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
