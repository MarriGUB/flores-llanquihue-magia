import { Link } from "@tanstack/react-router";
import { Moon, Sun, LogIn, LogOut, Settings } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { useAuth } from "@/lib/auth";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";

export function SiteHeader() {
  const { theme, toggle } = useTheme();
  const { session, isAdmin, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Flores Eternas Jovita" className="h-11 w-11 rounded-full object-cover" />
          <div className="hidden sm:block">
            <p className="font-display text-lg leading-tight text-primary">Flores Eternas Jovita</p>
            <p className="text-xs text-muted-foreground">Llanquihue · Hechas con amor</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Cambiar tema">
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {session && isAdmin && (
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin">
                <Settings className="mr-1.5 h-4 w-4" /> Admin
              </Link>
            </Button>
          )}

          {session ? (
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="mr-1.5 h-4 w-4" /> Salir
            </Button>
          ) : (
            <Button asChild variant="outline" size="sm">
              <Link to="/auth">
                <LogIn className="mr-1.5 h-4 w-4" /> Ingresar
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
