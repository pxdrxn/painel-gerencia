"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FiPieChart, 
  FiUsers, 
  FiHome, 
  FiCalendar, 
  FiCheckSquare, 
  FiActivity,
  FiClock,
  FiTrendingUp, 
  FiFileText,
  FiBriefcase,
  FiChevronLeft,
  FiChevronRight,
  FiLogOut
} from "react-icons/fi";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: FiPieChart },
  { label: "Funcionários", href: "/funcionarios", icon: FiUsers },
  { label: "CNPJ", href: "/cnpj", icon: FiBriefcase },
  { label: "Unidades", href: "/unidades", icon: FiHome },
  { label: "Férias", href: "/ferias", icon: FiCalendar },
  { label: "Disponibilidade", href: "/disponibilidade", icon: FiCheckSquare },
  { label: "Folgas & Faltas", href: "/folgas", icon: FiActivity },
  { label: "Sábados", href: "/sabados", icon: FiClock },
  { label: "Produção", href: "/producao", icon: FiTrendingUp },
  { label: "Rescisões", href: "/rescisao", icon: FiFileText },
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth(false);

  return (
    <aside className={cn(
      "bg-[#836FFF] text-purple-50 h-screen flex flex-col fixed left-0 top-0 overflow-y-auto transition-all duration-300 z-30",
      isCollapsed ? "w-20" : "w-64"
    )}>
      <div className={cn(
        "p-6 border-b border-[#705ae6]/30 flex items-center gap-2",
        isCollapsed ? "px-4 justify-center" : "justify-between"
      )}>
        {!isCollapsed && (
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <span className="text-white text-2xl font-black tracking-tighter">SOS</span>
              <span className="text-white">Crédito</span>
            </h1>
            <span className="text-[10px] font-semibold text-purple-200 uppercase tracking-widest pl-1 mt-1">
              Controle Gerencial
            </span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg bg-[#705ae6] text-white hover:bg-[#5d4ca3] transition-colors focus:outline-none focus:ring-2 focus:ring-[#836FFF] shrink-0"
          title={isCollapsed ? "Expandir menu" : "Recolher menu"}
        >
          {isCollapsed ? <FiChevronRight className="w-4 h-4" /> : <FiChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {!isCollapsed && (
          <div className="text-xs font-semibold text-purple-200/70 uppercase tracking-wider mb-4 px-3">
            Menu Principal
          </div>
        )}
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group",
                isActive 
                  ? "bg-[#5d4ca3] text-white shadow-inner" 
                  : "hover:bg-[#705ae6] hover:text-white",
                isCollapsed ? "justify-center px-0 py-3" : ""
              )}
            >
              <item.icon className={cn(
                "w-5 h-5 transition-colors shrink-0",
                isActive ? "text-white" : "text-purple-200 group-hover:text-white"
              )} />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-[#705ae6]/50">
        <button
          onClick={logout}
          title={isCollapsed ? "Sair do sistema" : undefined}
          className={cn(
            "flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-purple-100 hover:bg-[#705ae6] hover:text-white transition-colors group",
            isCollapsed ? "justify-center px-0" : ""
          )}
        >
          <FiLogOut className="w-5 h-5 text-purple-200 group-hover:text-white transition-colors shrink-0" />
          {!isCollapsed && <span>Sair do sistema</span>}
        </button>
      </div>
    </aside>
  );
}
