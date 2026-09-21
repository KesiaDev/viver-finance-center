import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./components/theme-provider";
import { AuthProvider } from "./contexts/AuthContext";
import { DuplicateProvider } from "./contexts/DuplicateContext";
import { AppPreferencesProvider } from "./contexts/AppPreferencesContext";
import { ProtectedRoute } from "./components/Auth/ProtectedRoute";
import { FinanceGuard } from "./components/guards/FinanceGuard";
import { AdminGuard } from "./components/guards/AdminGuard";
import { FinanceLayout } from "./components/finance/layout/FinanceLayout";
import { AdminLayout } from "./components/admin/layout/AdminLayout";
import { BirthdayPopup } from "./components/Birthday/BirthdayPopup";
import Index from "./pages/Index";
import Solicitacoes from "./pages/Solicitacoes";
import NotasFiscais from "./pages/NotasFiscais";
import Regras from "./pages/Regras";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminColaboradores from "./pages/admin/AdminColaboradores";
import AdminEquipamentos from "./pages/admin/AdminEquipamentos";
import AdminAutomacoes from "./pages/admin/AdminAutomacoes";
import AdminFerramentas from "./pages/admin/AdminFerramentas";
import AdminModelosContrato from "./pages/admin/AdminModelosContrato";

// Finance pages
import Planejamento from "./pages/financeiro/Planejamento";

import AnaliseFinanceira from "./pages/financeiro/AnaliseFinanceira";
import Impostos from "./pages/financeiro/Impostos";
import MetasVendas from "./pages/financeiro/MetasVendas";
import Bonus from "./pages/financeiro/Bonus";

import ParcelamentoInteligente from "./pages/financeiro/ParcelamentoInteligente";
import MarveeApiTest from "./pages/financeiro/MarveeApiTest";
import OrcadoRealizado from "./pages/financeiro/OrcadoRealizado";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark" storageKey="llmida-theme">
      <AuthProvider>
        <DuplicateProvider>
          <AppPreferencesProvider>
            <BirthdayPopup />
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Regras />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/regras" element={<Regras />} />
                  
                  <Route path="/solicitacoes" element={
                    <ProtectedRoute>
                      <Solicitacoes />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/notas-fiscais" element={
                    <ProtectedRoute>
                      <NotasFiscais />
                    </ProtectedRoute>
                  } />
                  
                  {/* Admin Module Routes */}
                  <Route path="/admin" element={
                    <AdminGuard>
                      <AdminLayout />
                    </AdminGuard>
                  }>
                    <Route index element={<Navigate to="aprovacoes" replace />} />
                    <Route path="aprovacoes" element={<AdminDashboard />} />
                    <Route path="colaboradores" element={<AdminColaboradores />} />
                    <Route path="equipamentos" element={<AdminEquipamentos />} />
                    <Route path="automacoes" element={<AdminAutomacoes />} />
                    <Route path="ferramentas" element={<AdminFerramentas />} />
                    <Route path="modelos-contrato" element={<AdminModelosContrato />} />
                  </Route>

                  {/* Finance Module Routes */}
                  <Route path="/financeiro" element={
                    <FinanceGuard>
                      <FinanceLayout />
                    </FinanceGuard>
                  }>
                    <Route index element={<Navigate to="planejamento" replace />} />
                    <Route path="planejamento" element={<Planejamento />} />
                    
                    <Route path="analise-financeira" element={<AnaliseFinanceira />} />
                    <Route path="impostos" element={<Impostos />} />
                    <Route path="metas-vendas" element={<MetasVendas />} />
                    <Route path="bonus" element={<Bonus />} />
                    
                    <Route path="parcelamento" element={<ParcelamentoInteligente />} />
                    <Route path="marvee-test" element={<MarveeApiTest />} />
                    <Route path="orcado-realizado" element={<OrcadoRealizado />} />
                  </Route>
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </AppPreferencesProvider>
        </DuplicateProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
