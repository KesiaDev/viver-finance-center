import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Brand/Logo";
import { Shield } from "lucide-react";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isFirstAccess, setIsFirstAccess] = useState(false);
  const [checkingFirstAccess, setCheckingFirstAccess] = useState(true);
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();

  // Verificar se é o primeiro acesso (sem colaboradores)
  useEffect(() => {
    const checkFirstAccess = async () => {
      try {
        const { data, error } = await supabase.rpc('is_first_access');
        if (!error && data === true) {
          setIsFirstAccess(true);
          setIsLogin(false); // Mostrar cadastro por padrão
        }
      } catch (err) {
        console.error('Erro ao verificar primeiro acesso:', err);
      } finally {
        setCheckingFirstAccess(false);
      }
    };
    checkFirstAccess();
  }, []);

  useEffect(() => {
    // Só redireciona quando loading terminar para garantir isAdmin correto
    if (!authLoading && user) {
      console.log('👤 Usuário logado, isAdmin:', isAdmin, 'loading:', authLoading);
      navigate(isAdmin ? "/admin" : "/solicitacoes");
    }
  }, [user, isAdmin, authLoading, navigate]);

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Digite seu email primeiro");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success("Email de recuperação enviado! Verifique sua caixa de entrada.");
      setIsForgotPassword(false);
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar email de recuperação");
    } finally {
      setLoading(false);
    }
  };

  const handleFirstAccessSignup = async () => {
    if (!nome.trim()) {
      toast.error("Digite seu nome");
      return;
    }

    setLoading(true);
    try {
      // Criar conta no auth
      const redirectUrl = `${window.location.origin}/`;
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (authError) throw authError;

      if (authData?.user) {
        // Configurar primeiro admin
        const { data: setupOk, error: setupError } = await supabase.rpc('setup_primeiro_admin', {
          p_email: email,
          p_user_id: authData.user.id,
          p_nome: nome.trim()
        });

        if (setupError) {
          console.error('Erro ao configurar admin:', setupError);
          toast.error("Erro ao configurar administrador. Tente novamente.");
          return;
        }

        if (setupOk) {
          toast.success("🎉 Primeiro administrador criado com sucesso! Você já pode fazer login.");
          setIsFirstAccess(false);
          setIsLogin(true);
        } else {
          toast.error("Não foi possível criar o administrador. Já existe um cadastro.");
        }
      }
    } catch (error: any) {
      const errorMessage = error.message || "Erro ao criar conta";
      if (errorMessage.includes("User already registered")) {
        toast.error("Este email já está cadastrado. Faça login.");
        setIsLogin(true);
      } else if (errorMessage.includes("Password should be at least")) {
        toast.error("A senha deve ter pelo menos 6 caracteres");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Se for primeiro acesso e cadastro, usar fluxo especial
    if (isFirstAccess && !isLogin) {
      await handleFirstAccessSignup();
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast.success("Login realizado com sucesso!");
      } else {
        // Signup normal - Validar domínio do email
        const emailDomain = email.split('@')[1]?.toLowerCase();
        const dominiosPermitidos = ['lucianolarrossa.com', 'llmidiaco.com'];
        
        if (!dominiosPermitidos.includes(emailDomain)) {
          toast.error("Apenas emails @lucianolarrossa.com ou @llmidiaco.com podem se cadastrar");
          setLoading(false);
          return;
        }

        // Validar se colaborador existe e está ativo
        const { data: validacao, error: validacaoError } = await supabase.rpc('validar_colaborador_signup', {
          p_email: email
        });

        if (validacaoError) {
          console.error('Erro ao validar colaborador:', validacaoError);
          toast.error("Erro ao verificar cadastro. Tente novamente.");
          setLoading(false);
          return;
        }

        const validacaoResult = validacao as { valid: boolean; reason?: string } | null;
        
        if (!validacaoResult?.valid) {
          switch (validacaoResult?.reason) {
            case 'not_found':
              toast.error("Email não encontrado no cadastro de colaboradores. Entre em contato com o RH.");
              break;
            case 'already_registered':
              toast.error("Este email já possui uma conta. Faça login.");
              setIsLogin(true);
              break;
            case 'inactive':
              toast.error("Seu cadastro está inativo. Entre em contato com o RH.");
              break;
            default:
              toast.error("Não foi possível validar seu cadastro. Entre em contato com o RH.");
          }
          setLoading(false);
          return;
        }

        // Colaborador validado, criar conta
        const redirectUrl = `${window.location.origin}/`;
        const { data: authData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });

        if (error) throw error;

        // Vincular ao colaborador
        if (authData?.user) {
          try {
            const { data: vinculado, error: rpcError } = await supabase.rpc('vincular_user_colaborador', {
              p_colaborador_email: email,
              p_user_id: authData.user.id
            });

            if (rpcError) {
              console.error('Erro ao vincular colaborador:', rpcError);
            } else if (vinculado) {
              console.log('✅ Colaborador vinculado ao usuário');
            }
          } catch (rpcErr) {
            console.error('Erro na chamada RPC:', rpcErr);
          }
        }

        toast.success("Conta criada com sucesso! Você já pode fazer login.");
        setIsLogin(true);
      }
    } catch (error: any) {
      const errorMessage = error.message || "Erro ao processar sua solicitação";
      
      // Traduzir algumas mensagens comuns
      if (errorMessage.includes("Invalid login credentials")) {
        toast.error("Email ou senha incorretos");
      } else if (errorMessage.includes("User already registered")) {
        toast.error("Este email já está cadastrado. Faça login.");
        setIsLogin(true);
      } else if (errorMessage.includes("Password should be at least")) {
        toast.error("A senha deve ter pelo menos 6 caracteres");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingFirstAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-[hsl(210_80%_12%)] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  if (isForgotPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-[hsl(210_80%_12%)] flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-0 bg-[hsl(210_80%_12%)] shadow-2xl shadow-black/40">
          <CardHeader className="space-y-1">
            <div className="flex flex-col items-center gap-6 mb-4">
            <Logo size="lg" />
              <CardTitle className="text-xl text-center font-normal">Recuperar Senha</CardTitle>
            </div>
            <CardDescription className="text-center">
              Digite seu email para receber um link de recuperação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-[hsl(210_91%_9%)] border-white/10 focus:border-brand-cyan/50"
                />
              </div>
              <Button onClick={handleForgotPassword} className="w-full" disabled={loading}>
                {loading ? "Enviando..." : "Enviar Link de Recuperação"}
              </Button>
            </div>
            <div className="mt-4 text-center text-sm">
              <button
                type="button"
                onClick={() => setIsForgotPassword(false)}
                className="text-primary hover:underline"
              >
                Voltar ao login
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-[hsl(210_80%_12%)] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 bg-[hsl(210_80%_12%)] shadow-2xl shadow-black/40">
        <CardHeader className="space-y-1">
          <div className="flex flex-col items-center gap-6 mb-4">
            <Logo size="lg" />
            <div className="text-center">
              <CardTitle className="text-xl font-normal tracking-wide">Central Financeira</CardTitle>
            </div>
          </div>
          
          {isFirstAccess && !isLogin && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-primary mb-2">
                <Shield className="h-5 w-5" />
                <span className="font-medium">Primeiro Acesso</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Você será o primeiro administrador do sistema. Após o cadastro, poderá adicionar outros colaboradores.
              </p>
            </div>
          )}
          
          <CardDescription className="text-center">
            {isFirstAccess && !isLogin
              ? "Configure o primeiro administrador do sistema"
              : isLogin
                ? "Entre com suas credenciais para acessar o sistema"
                : "Crie sua conta para acessar o sistema"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isFirstAccess && !isLogin && (
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Seu nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className="bg-[hsl(210_91%_9%)] border-white/10 focus:border-brand-cyan/50"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder={isFirstAccess ? "seu@email.com" : "seu@llmidiaco.com"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-[hsl(210_91%_9%)] border-white/10 focus:border-brand-cyan/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-[hsl(210_91%_9%)] border-white/10 focus:border-brand-cyan/50"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Processando..." : isLogin ? "Entrar" : isFirstAccess ? "Criar Administrador" : "Criar Conta"}
            </Button>
          </form>
          
          {isLogin && (
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => setIsForgotPassword(true)}
                className="text-sm text-muted-foreground hover:text-primary hover:underline"
              >
                Esqueci minha senha
              </button>
            </div>
          )}
          
          {!isFirstAccess && (
            <div className="mt-4 text-center text-sm">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline"
              >
                {isLogin
                  ? "Não tem uma conta? Cadastre-se"
                  : "Já tem uma conta? Faça login"}
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
