import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, Upload, Flower2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

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
      const { data, error } = await supabase.from("flowers").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Flower[];
    },
    enabled: !!session && isAdmin,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["flowers-admin"] });
    qc.invalidateQueries({ queryKey: ["flowers-public"] });
  };

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
  const toggleAvailable = async () => {
    const { error } = await supabase
      .from("flowers")
      .update({ is_available: !flower.is_available })
      .eq("id", flower.id);
    if (error) toast.error(error.message);
    else {
      toast.success(flower.is_available ? "Marcada como agotada" : "Marcada como disponible");
      onChanged();
    }
  };

  const remove = async () => {
    if (!confirm(`¿Eliminar "${flower.name}"?`)) return;
    const { error } = await supabase.from("flowers").delete().eq("id", flower.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Eliminada");
      onChanged();
    }
  };

  return (
    <Card className="overflow-hidden shadow-[var(--shadow-soft)]">
      <div className="relative aspect-square bg-muted">
        {flower.image_url ? (
          <img src={flower.image_url} alt={flower.name} className="h-full w-full object-cover" loading="lazy" />
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
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("flowers").upload(path, file);
    if (error) {
      toast.error(error.message);
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("flowers").getPublicUrl(path);
    setImageUrl(data.publicUrl);
    setUploading(false);
    toast.success("Imagen subida");
  };

  const save = async () => {
    if (!name.trim()) return toast.error("El nombre es obligatorio");
    setSaving(true);
    const payload = {
      name: name.trim(),
      type: type.trim() || null,
      description: description.trim() || null,
      price: parseFloat(price) || 0,
      stock: parseInt(stock) || 0,
      image_url: imageUrl || null,
    };
    const { error } = flower
      ? await supabase.from("flowers").update(payload).eq("id", flower.id)
      : await supabase.from("flowers").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(flower ? "Actualizada" : "Creada");
    setOpen(false);
    onSaved();
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
              {imageUrl && <img src={imageUrl} alt="preview" className="h-16 w-16 rounded-md object-cover" />}
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
          <Button onClick={save} disabled={saving}>{saving ? "Guardando..." : "Guardar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
