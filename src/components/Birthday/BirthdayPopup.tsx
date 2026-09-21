import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Cake, PartyPopper } from "lucide-react";
import { Confetti } from "./Confetti";

interface Colaborador {
  id: string;
  nome: string;
  email: string;
  data_nascimento: string | null;
}

export const BirthdayPopup = () => {
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [aniversariantes, setAniversariantes] = useState<Colaborador[]>([]);
  const [isUserBirthday, setIsUserBirthday] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkBirthdays = async () => {
      const hoje = new Date();
      const storageKey = `birthday-popup-shown-${hoje.toISOString().split('T')[0]}-${user.id}`;

      const { data: colaboradores, error } = await supabase
        .from("colaboradores")
        .select("id, nome, email, data_nascimento")
        .eq("ativo", true)
        .not("data_nascimento", "is", null);

      if (error || !colaboradores) return;

      // Filtra aniversariantes de hoje - extrai dia/mês diretamente da string para evitar problemas de timezone
      const aniversariantesHoje = colaboradores.filter((c) => {
        if (!c.data_nascimento) return false;
        const [, mes, dia] = c.data_nascimento.split('-').map(Number);
        return (
          dia === hoje.getDate() &&
          mes === (hoje.getMonth() + 1) // getMonth() retorna 0-11
        );
      });

      if (aniversariantesHoje.length === 0) return;

      // Verifica se o usuário logado é aniversariante
      const userEmail = user.email?.toLowerCase();
      const userIsAniversariante = aniversariantesHoje.some(
        (c) => c.email.toLowerCase() === userEmail
      );

      setAniversariantes(aniversariantesHoje);
      setIsUserBirthday(userIsAniversariante);

      // Se é aniversariante: SEMPRE mostra popup (a cada login)
      if (userIsAniversariante) {
        setOpen(true);
        return;
      }

      // Se é admin (não aniversariante): mostra apenas uma vez por dia
      if (isAdmin) {
        if (!localStorage.getItem(storageKey)) {
          setOpen(true);
          localStorage.setItem(storageKey, "true");
        }
      }
    };

    checkBirthdays();
  }, [user, isAdmin]);

  const calcularIdade = (dataNascimento: string) => {
    const hoje = new Date();
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mesAtual = hoje.getMonth();
    const mesNascimento = nascimento.getMonth();
    if (mesAtual < mesNascimento || (mesAtual === mesNascimento && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    return idade;
  };

  if (!open) return null;

  // Se o usuário é aniversariante (admin ou não), mostra mensagem pessoal
  if (isUserBirthday) {
    return (
      <>
        <Confetti />
        <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500">
                <PartyPopper className="w-10 h-10 text-white" />
              </div>
            </div>
            <DialogTitle className="text-2xl text-center">
              🎉 Feliz Aniversário! 🎉
            </DialogTitle>
            <DialogDescription className="text-center text-base mt-4">
              Parabéns pelo seu dia especial!
              <br />
              <br />
              Toda a equipe <span className="font-semibold text-primary">Viver de IA</span> deseja 
              muitas felicidades e sucesso!
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center mt-4">
            <Button onClick={() => setOpen(false)} className="px-8">
              Obrigado! 🎂
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </>
    );
  }

  // Para admins, mostra lista de aniversariantes
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-gradient-to-br from-pink-500 to-purple-600">
              <Cake className="w-10 h-10 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl text-center">
            🎂 Aniversariantes de Hoje!
          </DialogTitle>
          <DialogDescription className="text-center mt-2">
            Não esqueça de parabenizá-los!
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 space-y-3">
          {aniversariantes.map((aniversariante) => (
            <div
              key={aniversariante.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">🎈</div>
                <div>
                  <p className="font-medium text-foreground">{aniversariante.nome}</p>
                  <p className="text-sm text-muted-foreground">{aniversariante.email}</p>
                </div>
              </div>
              {aniversariante.data_nascimento && (
                <div className="text-right">
                  <span className="text-lg font-bold text-primary">
                    {calcularIdade(aniversariante.data_nascimento)} anos
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-6">
          <Button onClick={() => setOpen(false)} className="px-8">
            Entendido! 🎉
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
