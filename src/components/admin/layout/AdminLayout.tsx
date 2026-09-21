import { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { Header } from "@/components/Layout/Header";
import { Navigation } from "@/components/Layout/Navigation";
import { AdminNavigation } from "./AdminNavigation";

interface AdminLayoutProps {
  children?: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      <AdminNavigation />
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        {children || <Outlet />}
      </main>
    </div>
  );
};
