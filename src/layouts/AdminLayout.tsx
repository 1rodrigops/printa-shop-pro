import { ReactNode } from "react";
import SidebarAdmin from "@/components/SidebarAdmin";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarAdmin />

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
