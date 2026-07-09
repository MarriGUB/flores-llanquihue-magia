import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: "/admin" });
  }, [session, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("¡Bienvenido!");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success("Cuenta creada. Ya puedes iniciar sesión.");
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div
        className="flex items-center justify-center px-4 py-16"
        style={{ background: "var(--gradient-bloom)" }}
      >
        <Card className="w-full max-w-md shadow-[var(--shadow-soft)]">
          <CardHeader className="text-center">
            <img src={logo} alt="Logo" className="mx-auto mb-3 h-20 w-20 rounded-full" />
            <CardTitle className="font-display text-2xl">Acceso administradora</CardTitle>
            <p className="text-sm text-muted-foreground">Solo para administrar el catálogo</p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin">
              <TabsList className="mb-4 grid w-full grid-cols-2">
                <TabsTrigger value="signin">Ingresar</TabsTrigger>
                <TabsTrigger value="signup">Crear cuenta</TabsTrigger>
              </TabsList>
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <Field label="Correo" value={email} onChange={setEmail} type="email" />
                  <Field label="Contraseña" value={password} onChange={setPassword} type="password" />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Ingresando..." : "Ingresar"}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <Field label="Correo" value={email} onChange={setEmail} type="email" />
                  <Field label="Contraseña" value={password} onChange={setPassword} type="password" />
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creando..." : "Crear cuenta"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    La primera cuenta creada será la administradora.
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, type = "text",
}: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} required />
    </div>
  );
}
