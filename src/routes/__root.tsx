import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode } from "react";

import appCss from "../styles.css?url";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "sonner";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Flores Eternas Jovita — Flores artesanales en Llanquihue" },
      {
        name: "description",
        content:
          "Flores eternas hechas a mano con amor y cariño en Llanquihue. Ramos, arreglos y detalles únicos por Jovita.",
      },
      { property: "og:title", content: "Flores Eternas Jovita — Flores artesanales en Llanquihue" },
      {
        property: "og:description",
        content: "Flores eternas hechas a mano con amor y cariño en Llanquihue. Ramos, arreglos y detalles únicos por Jovita.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Flores Eternas Jovita — Flores artesanales en Llanquihue" },
      { name: "twitter:description", content: "Flores eternas hechas a mano con amor y cariño en Llanquihue. Ramos, arreglos y detalles únicos por Jovita." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/cb749c88-b439-4046-baa3-a6206fe57229/id-preview-bb3e27ae--aa46c513-2864-42f4-844e-704e904b6300.lovable.app-1783576031667.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/cb749c88-b439-4046-baa3-a6206fe57229/id-preview-bb3e27ae--aa46c513-2864-42f4-844e-704e904b6300.lovable.app-1783576031667.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Inter:wght@400;500;600&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Outlet />
          <Toaster position="top-center" richColors />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
