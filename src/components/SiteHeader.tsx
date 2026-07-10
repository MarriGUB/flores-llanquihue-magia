import { Link } from "@tanstack/react-router";
import { Moon, Settings, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={logo}
            alt="Flores Eternas Jovita"
            className="h-11 w-11 rounded-full object-cover"
          />
          <div className="hidden sm:block">
            <p className="font-display text-lg leading-tight text-primary">Flores Eternas Jovita</p>
            <p className="text-xs text-muted-foreground">Llanquihue · Hechas con amor</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Cambiar tema">
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <Button asChild variant="outline" size="sm">
            <Link to="/admin">
              <Settings className="mr-1.5 h-4 w-4" /> Administrar
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
