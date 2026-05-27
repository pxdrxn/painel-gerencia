"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FiPieChart, 
  FiUsers, 
  FiHome, 
  FiCalendar, 
  FiCheckSquare, 
  FiTrendingUp, 
  FiActivity,
  FiLogOut
} from "react-icons/fi";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: FiPieChart },
  { label: "Funcionários", href: "/funcionarios", icon: FiUsers },
  { label: "Unidades", href: "/unidades", icon: FiHome },
  { label: "Férias", href: "/ferias", icon: FiCalendar },
  { label: "Disponibilidade", href: "/disponibilidade", icon: FiCheckSquare },
  { label: "Folgas & Faltas", href: "/folgas", icon: FiActivity },
  { label: "Produção", href: "/producao", icon: FiTrendingUp },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth(false);

  return (
    <aside className="w-64 bg-[#836FFF] text-purple-50 h-screen flex flex-col fixed left-0 top-0 overflow-y-auto">
      <div className="p-6 border-b border-[#705ae6]/30">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span className="text-white text-2xl font-black tracking-tighter">SOS</span>
            <span className="text-white">Crédito</span>
          </h1>
          <span className="text-[10px] font-semibold text-purple-200 uppercase tracking-widest pl-1 mt-1">
            Controle Gerencial
          </span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        <div className="text-xs font-semibold text-purple-200/70 uppercase tracking-wider mb-4 px-3">
          Menu Principal
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group",
                isActive 
                  ? "bg-[#5d4ca3] text-white shadow-inner" 
                  : "hover:bg-[#705ae6] hover:text-white"
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-colors",
                isActive ? "text-white" : "text-purple-200 group-hover:text-white"
              )} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-[#705ae6]/50">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-purple-100 hover:bg-[#705ae6] hover:text-white transition-colors group"
        >
          <FiLogOut className="w-5 h-5 text-purple-200 group-hover:text-white transition-colors" />
          Sair do sistema
        </button>
      </div>
    </aside>
  );
}
