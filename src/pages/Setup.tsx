import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Loader2 } from "lucide-react";

const setupSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  confirmPassword: z.string(),
  nome_completo: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  telefone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type SetupFormData = z.infer<typeof setupSchema>;

const Setup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetupFormData>({
    resolver: zodResolver(setupSchema),
    defaultValues: {
      email: "admin@agilgp.com.br",
      password: "Agil@2025",
      confirmPassword: "Agil@2025",
      nome_completo: "Administrador Sistema",
      telefone: "",
    },
  });

  const onSubmit = async (data: SetupFormData) => {
    setLoading(true);
    try {
      // Criar usuário com Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            nome_completo: data.nome_completo,
            telefone: data.telefone || "",
          },
        },
      });

      if (signUpError) throw signUpError;

      if (!authData.user) {
        throw new Error("Erro ao criar usuário");
      }

      // Criar role de superadmin
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: authData.user.id,
          role: "superadmin",
          empresa_id: null,
        });

      if (roleError) {
        console.error("Erro ao criar role:", roleError);
        // Continuar mesmo se houver erro na role, o usuário foi criado
      }

      toast({
        title: "SuperAdmin criado!",
        description: "Você será redirecionado para fazer login.",
      });

      // Fazer logout automático para forçar login
      await supabase.auth.signOut();

      setTimeout(() => {
        navigate("/auth");
      }, 2000);
    } catch (error: any) {
      console.error("Erro no setup:", error);
      toast({
        title: "Erro ao criar SuperAdmin",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Setup Inicial</CardTitle>
          <CardDescription>
            Crie o primeiro SuperAdmin do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="nome_completo">
                Nome Completo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nome_completo"
                {...register("nome_completo")}
                placeholder="Seu nome completo"
              />
              {errors.nome_completo && (
                <p className="text-sm text-destructive mt-1">
                  {errors.nome_completo.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="email">
                E-mail <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="admin@empresa.com"
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="telefone">Telefone (opcional)</Label>
              <Input
                id="telefone"
                {...register("telefone")}
                placeholder="(41) 99999-9999"
              />
            </div>

            <div>
              <Label htmlFor="password">
                Senha <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                placeholder="Mínimo 6 caracteres"
              />
              {errors.password && (
                <p className="text-sm text-destructive mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">
                Confirmar Senha <span className="text-destructive">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                {...register("confirmPassword")}
                placeholder="Repita a senha"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive mt-1">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar SuperAdmin"
              )}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <p>Após criar o SuperAdmin, você será redirecionado para fazer login.</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Setup;
