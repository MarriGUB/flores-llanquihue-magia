import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Upload, Flower2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { SocialIcon, SOCIAL_PLATFORM_OPTIONS } from "@/lib/social-icons";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:4001';

type Flower = {
  id: string;
  name: string;
  type: string | null;
  description: string | null;
  price: number;
  stock: number;
  image_url: string | null;
  is_available: boolean;
};

type SocialLink = {
  id: string;
  name: string;
  platform: string;
  url: string;
  created_at: string;
  updated_at: string;
};

function AdminPage() {
  const { session, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (loading) return;
    if (!session) navigate({ to: "/auth" });
  }, [session, loading, navigate]);

  const { data: flowers = [] } = useQuery({
    queryKey: ["flowers-admin"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/flowers`);
      if (!res.ok) throw new Error('Failed to load flowers');
      return (await res.json()) as Flower[];
    },
    enabled: !!session && isAdmin,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["flowers-admin"] });
    qc.invalidateQueries({ queryKey: ["flowers-public"] });
    qc.invalidateQueries({ queryKey: ["social-links-admin"] });
    qc.invalidateQueries({ queryKey: ["social-links-public"] });
  };

  const { data: socialLinks = [], error: socialLinksError } = useQuery({
    queryKey: ["social-links-admin"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/social-links`);
      if (!res.ok) throw new Error('Failed to load social links');
      return (await res.json()) as SocialLink[];
    },
    enabled: !!session && isAdmin,
  });

  if (loading) return <FullPageMsg text="Cargando..." />;
  if (!session) return null;
  if (!isAdmin)
    return <FullPageMsg text="No tienes permisos de administradora." />;

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
          <FlowerDialog onSaved={refresh}>
            <Button>
              <Plus className="mr-1.5 h-4 w-4" /> Nueva flor
            </Button>
          </FlowerDialog>
        </div>

        {flowers.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-14 text-center">
              <Flower2 className="mx-auto mb-3 h-10 w-10 text-primary" />
              <p className="font-display text-xl">Aún no hay flores</p>
              <p className="text-sm text-muted-foreground">Agrega la primera con el botón de arriba.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {flowers.map((f) => (
              <AdminFlowerCard key={f.id} flower={f} onChanged={refresh} />
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
            <SocialLinkDialog onSaved={refresh}>
              <Button>
                <Plus className="mr-1.5 h-4 w-4" /> Agregar red social
              </Button>
            </SocialLinkDialog>
          </div>

          {socialLinksError ? (
            <Card className="border-l-2 border-destructive/60">
              <CardContent className="py-6">
                <p className="font-display text-lg text-destructive">No se pudo cargar `social_links`</p>
                <p className="mt-2 text-sm text-muted-foreground">{String(socialLinksError.message)}</p>
                      <p className="mt-2 text-sm">
                        Comprueba que la API local esté en ejecución y que la tabla `social_links` exista en la base de datos MySQL.
                        Si usas la API incluida en el proyecto, aplica la migración: <strong>api/migrations/mysql_create_tables.sql</strong> o revisa que `VITE_API_URL` apunte al backend correcto.
                      </p>
              </CardContent>
            </Card>
          ) : socialLinks.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-14 text-center">
                <Flower2 className="mx-auto mb-3 h-10 w-10 text-primary" />
                <p className="font-display text-xl">Aún no hay redes sociales</p>
                <p className="text-sm text-muted-foreground">Añade la primera para mostrarla en la página.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {socialLinks.map((link) => (
                <AdminSocialLinkCard key={link.id} link={link} onChanged={refresh} />
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

function AdminFlowerCard({ flower, onChanged }: { flower: Flower; onChanged: () => void }) {
  const [hasImageError, setHasImageError] = useState(false);
  const toggleAvailable = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/flowers/${flower.id}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...flower, is_available: !flower.is_available }),
      });
      if (!res.ok) throw new Error('Error updating');
      toast.success(flower.is_available ? 'Marcada como agotada' : 'Marcada como disponible');
      onChanged();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Error actualizando');
    }
  };

  const remove = async () => {
    if (!confirm(`¿Eliminar "${flower.name}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/flowers/${flower.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error deleting');
      toast.success('Eliminada');
      onChanged();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Error eliminando');
    }
  };

  return (
    <Card className="overflow-hidden shadow-[var(--shadow-soft)]">
      <div className="relative aspect-square bg-muted">
        {flower.image_url && !hasImageError ? (
          <img
            src={flower.image_url}
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
          <Badge variant="destructive" className="absolute right-2 top-2">Agotada</Badge>
        )}
      </div>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-lg">{flower.name}</h3>
            {flower.type && <p className="text-xs text-muted-foreground">{flower.type}</p>}
          </div>
          <p className="font-display text-primary">${Number(flower.price).toLocaleString("es-CL")}</p>
        </div>
        <p className="text-xs text-muted-foreground">Stock: {flower.stock}</p>
        <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
          <div className="flex items-center gap-2">
            <Switch checked={flower.is_available} onCheckedChange={toggleAvailable} id={`av-${flower.id}`} />
            <Label htmlFor={`av-${flower.id}`} className="text-xs">Disponible</Label>
          </div>
          <div className="flex gap-1">
            <FlowerDialog flower={flower} onSaved={onChanged}>
              <Button size="icon" variant="ghost">
                <Pencil className="h-4 w-4" />
              </Button>
            </FlowerDialog>
            <Button size="icon" variant="ghost" onClick={remove}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminSocialLinkCard({ link, onChanged }: { link: SocialLink; onChanged: () => void }) {
  const remove = async () => {
    if (!confirm(`¿Eliminar "${link.name}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/social-links/${link.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error deleting');
      toast.success('Enlace eliminado');
      onChanged();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Error eliminando');
    }
  };

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
            <SocialLinkDialog socialLink={link} onSaved={onChanged}>
              <Button size="icon" variant="ghost">
                <Pencil className="h-4 w-4" />
              </Button>
            </SocialLinkDialog>
            <Button size="icon" variant="ghost" onClick={remove}>
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
  onSaved,
}: {
  children: React.ReactNode;
  socialLink?: SocialLink;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(socialLink?.name ?? "");
  const [platform, setPlatform] = useState(socialLink?.platform ?? "instagram");
  const [url, setUrl] = useState(socialLink?.url ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) return toast.error("El nombre es obligatorio");
    if (!url.trim()) return toast.error('La URL es obligatoria');
    setSaving(true);
    try {
      const payload = { name: name.trim(), platform: platform.trim(), url: url.trim() };
      const method = socialLink ? 'PUT' : 'POST';
      const urlPath = socialLink ? `${API_BASE}/api/social-links/${socialLink.id}` : `${API_BASE}/api/social-links`;
      const res = await fetch(urlPath, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Error saving social link');
      toast.success(socialLink ? 'Actualizado' : 'Creado');
      setOpen(false);
      onSaved();
    } catch (err: any) {
      console.error('Social link save error:', err);
      toast.error(err?.message || 'Error guardando');
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
            <Input value={name} onChange={(e) => setName(e.target.value)} />
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
            <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FlowerDialog({
  children, flower, onSaved,
}: { children: React.ReactNode; flower?: Flower; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(flower?.name ?? "");
  const [type, setType] = useState(flower?.type ?? "");
  const [description, setDescription] = useState(flower?.description ?? "");
  const [price, setPrice] = useState(flower?.price?.toString() ?? "0");
  const [stock, setStock] = useState(flower?.stock?.toString() ?? "1");
  const [imageUrl, setImageUrl] = useState(flower?.image_url ?? "");
  const [previewUrl, setPreviewUrl] = useState(flower?.image_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(flower?.name ?? "");
    setType(flower?.type ?? "");
    setDescription(flower?.description ?? "");
    setPrice(flower?.price?.toString() ?? "0");
    setStock(flower?.stock?.toString() ?? "1");
    setImageUrl(flower?.image_url ?? "");
    setPreviewUrl(flower?.image_url ?? "");
  }, [flower]);

  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const upload = async (file: File) => {
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setUploading(true);
    try {
      const resizeImage = async (file: File, maxSize = 1200) => {
        if (!file.type.startsWith('image/')) return file;
        const imgBitmap = await createImageBitmap(file);
        const ratio = Math.min(1, maxSize / Math.max(imgBitmap.width, imgBitmap.height));
        const outW = Math.round(imgBitmap.width * ratio);
        const outH = Math.round(imgBitmap.height * ratio);
        const canvas = document.createElement('canvas');
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext('2d');
        if (!ctx) return file;
        ctx.drawImage(imgBitmap, 0, 0, outW, outH);
        const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.8));
        if (!blob) return file;
        const newFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
        return newFile;
      };

      const toUpload = await resizeImage(file, 1200);
      const fd = new FormData();
      fd.append('file', toUpload as Blob, (toUpload as File).name);
      const res = await fetch(`${API_BASE}/api/upload`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error('Error uploading file');
      const body = await res.json();
      const publicUrl = body.url;
      const normalized = publicUrl.startsWith('/') ? `${API_BASE}${publicUrl}` : publicUrl;
      setImageUrl(normalized);
      setPreviewUrl(normalized);
      toast.success('Imagen subida');
    } catch (err: any) {
      console.error('Upload failed:', err);
      toast.error(err?.message ?? 'Error al procesar la imagen');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!name.trim()) return toast.error("El nombre es obligatorio");
    if (!imageUrl) return toast.error('Sube una foto para la flor antes de guardar');
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        type: type.trim() || null,
        description: description.trim() || null,
        price: parseFloat(price) || 0,
        stock: parseInt(stock) || 0,
        image_url: imageUrl,
      };
      const method = flower ? 'PUT' : 'POST';
      const urlPath = flower ? `${API_BASE}/api/flowers/${flower.id}` : `${API_BASE}/api/flowers`;
      const res = await fetch(urlPath, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error('Error saving flower');
      toast.success(flower ? 'Actualizada' : 'Creada');
      setOpen(false);
      onSaved();
    } catch (err: any) {
      console.error('Flower save error:', err);
      toast.error(err?.message || 'Error guardando');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{flower ? "Editar flor" : "Nueva flor"}</DialogTitle>
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
                {uploading ? "Subiendo..." : imageUrl ? "Cambiar" : "Subir imagen"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
                />
              </label>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nombre</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Tipo</Label>
              <Input value={type} onChange={(e) => setType(e.target.value)} placeholder="Rosa, Girasol..." />
            </div>
          </div>
          <div>
            <Label>Descripción</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Precio (CLP)</Label>
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div>
              <Label>Cantidad disponible</Label>
              <Input type="number" value={stock} onChange={(e) => setStock(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={save} disabled={saving || uploading}>{saving || uploading ? (uploading ? "Subiendo..." : "Guardando...") : "Guardar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
