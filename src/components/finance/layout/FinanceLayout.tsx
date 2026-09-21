import { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "@/components/Layout/Header";
import { Navigation } from "@/components/Layout/Navigation";
import { FinanceNavigation } from "./FinanceNavigation";

interface FinanceLayoutProps {
  children?: ReactNode;
  title?: string;
}

export const FinanceLayout = ({ children, title }: FinanceLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      <FinanceNavigation />
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        {title && (
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {title}
            </h1>
          </div>
        )}
        {children || <Outlet />}
      </main>
    </div>
  );
};
