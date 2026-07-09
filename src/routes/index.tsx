import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Instagram, Flower2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { IntroSplash } from "@/components/IntroSplash";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/")({
  component: Index,
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

function Index() {
  const { data: flowers = [], isLoading } = useQuery({
    queryKey: ["flowers-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("flowers")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Flower[];
    },
  });

  const totalStock = flowers.reduce((s, f) => s + (f.is_available ? f.stock : 0), 0);
  const types = new Set(flowers.map((f) => f.type).filter(Boolean));

  return (
    <>
      <IntroSplash />
      <div className="min-h-screen bg-background">
        <SiteHeader />

        {/* Hero */}
        <section
          className="relative overflow-hidden border-b border-border/60"
          style={{ background: "var(--gradient-bloom)" }}
        >
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-2 md:items-center md:py-24">
            <div className="animate-fade-up">
              <Badge variant="secondary" className="mb-4">
                <MapPin className="mr-1 h-3 w-3" /> Llanquihue, Chile
              </Badge>
              <h1 className="font-display text-4xl leading-tight text-primary sm:text-5xl md:text-6xl">
                Flores eternas,<br />hechas con amor
              </h1>
              <p className="mt-5 max-w-md text-base text-muted-foreground sm:text-lg">
                Ramos y arreglos artesanales que duran para siempre. Cada pétalo
                trabajado a mano por Jovita, con dedicación y ternura.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Flower2 className="h-4 w-4 text-primary" />
                  {flowers.length} diseños disponibles
                </span>
                <span>·</span>
                <span>{types.size} variedades</span>
                <span>·</span>
                <span>{totalStock} en stock</span>
              </div>
              <a
                href="https://instagram.com/flores.eternas.jovita"
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                <Instagram className="h-4 w-4" /> Síguenos en Instagram
              </a>
            </div>
            <div className="flex justify-center md:justify-end">
              <div className="animate-petal-float relative">
                <img
                  src={logo}
                  alt="Logo Flores Eternas Jovita"
                  className="h-64 w-64 rounded-full object-cover shadow-[var(--shadow-soft)] sm:h-80 sm:w-80"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Catalog */}
        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h2 className="font-display text-3xl text-foreground sm:text-4xl">Nuestras flores</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Cada pieza es única. Disponibilidad actualizada en tiempo real.
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-80 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : flowers.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-14 text-center">
                <Flower2 className="mx-auto mb-3 h-10 w-10 text-primary" />
                <p className="font-display text-xl text-foreground">Pronto florecerán aquí</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Aún no hay flores publicadas. ¡Vuelve pronto!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {flowers.map((f) => (
                <FlowerCard key={f.id} flower={f} />
              ))}
            </div>
          )}
        </section>

        <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
          <p className="font-display text-base text-primary">Flores Eternas Jovita</p>
          <p className="mt-1">Llanquihue · Hechas con amor y cariño 🌹</p>
        </footer>
      </div>
    </>
  );
}

function FlowerCard({ flower }: { flower: Flower }) {
  const soldOut = !flower.is_available || flower.stock <= 0;
  return (
    <Card className="group overflow-hidden border-border/70 shadow-[var(--shadow-soft)] transition-transform hover:-translate-y-1">
      <div className="relative aspect-square overflow-hidden bg-muted">
        {flower.image_url ? (
          <img
            src={flower.image_url}
            alt={flower.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Flower2 className="h-16 w-16 text-primary/40" />
          </div>
        )}
        {soldOut && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm">
            <Badge variant="destructive" className="text-sm">Agotado</Badge>
          </div>
        )}
      </div>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-xl text-foreground">{flower.name}</h3>
            {flower.type && (
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{flower.type}</p>
            )}
          </div>
          <p className="font-display text-lg text-primary">
            ${Number(flower.price).toLocaleString("es-CL")}
          </p>
        </div>
        {flower.description && (
          <p className="mt-2 text-sm text-muted-foreground">{flower.description}</p>
        )}
        {!soldOut && (
          <p className="mt-3 text-xs text-muted-foreground">Quedan {flower.stock} disponibles</p>
        )}
      </CardContent>
    </Card>
  );
}
