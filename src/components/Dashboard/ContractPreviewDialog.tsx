import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Send, Eye, Code } from "lucide-react";

interface ContractPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  solicitacaoId: string | null;
  onSent: () => void;
}

export const ContractPreviewDialog = ({ open, onOpenChange, solicitacaoId, onSent }: ContractPreviewDialogProps) => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [viewMode, setViewMode] = useState<"preview" | "code">("preview");

  useEffect(() => {
    if (open && solicitacaoId) {
      loadPreview();
      setViewMode("preview");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, solicitacaoId]);

  const loadPreview = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-contract", {
        body: { solicitacaoId, mode: "preview" },
      });
      if (error) throw error;
      setContent(data.content || "");
    } catch (e: any) {
      toast.error("Erro ao gerar preview: " + e.message);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!solicitacaoId) return;
    setSending(true);
    try {
      const { error: fnError } = await supabase.functions.invoke("generate-contract", {
        body: { solicitacaoId, mode: "send", content },
      });
      if (fnError) throw fnError;

      const { error } = await supabase
        .from("solicitacoes_contrato")
        .update({ status: "assinatura" })
        .eq("id", solicitacaoId);
      if (error) throw error;

      toast.success("Contrato enviado para assinatura!");
      onSent();
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Erro ao enviar: " + e.message);
    } finally {
      setSending(false);
    }
  };

  const isHtml = content.trim().startsWith("<!DOCTYPE") || content.trim().startsWith("<html") || content.trim().startsWith("<!doctype");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-primary">Visualizar Contrato</DialogTitle>
          {isHtml && !loading && (
            <Button
              variant="outline"
              size="sm"
              type="button"
              className="gap-1.5"
              onClick={() => setViewMode(viewMode === "preview" ? "code" : "preview")}
            >
              {viewMode === "preview" ? (
                <><Code className="w-3.5 h-3.5" /> Editar HTML</>
              ) : (
                <><Eye className="w-3.5 h-3.5" /> Visualizar</>
              )}
            </Button>
          )}
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Gerando preview...</span>
          </div>
        ) : viewMode === "preview" && isHtml ? (
          <div
            className="flex-1 min-h-[500px] overflow-auto border rounded-md bg-white p-0"
          >
            <iframe
              srcDoc={content}
              className="w-full min-h-[500px] border-0"
              style={{ height: "600px" }}
              title="Preview do contrato"
            />
          </div>
        ) : (
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="flex-1 min-h-[500px] font-mono text-sm"
          />
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancelar
          </Button>
          <Button onClick={handleSend} disabled={loading || sending}>
            {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
            Confirmar e Enviar para Assinatura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
