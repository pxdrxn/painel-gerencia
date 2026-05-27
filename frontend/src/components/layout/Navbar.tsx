"use client";

import { useAuth } from "@/hooks/useAuth";
import { FiSearch, FiBell, FiChevronDown, FiUser } from "react-icons/fi";
import Badge from "../ui/Badge";

export default function Navbar() {
  const { user } = useAuth(false);

  return (
    <nav className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-96 hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#836FFF] focus:border-[#836FFF] bg-gray-50 transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="text-gray-400 hover:text-gray-600 transition-colors relative">
          <FiBell className="w-5 h-5" />
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        </button>

        <div className="h-8 w-px bg-gray-200"></div>

        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-[#F3E8FF] flex items-center justify-center text-[#581C87]">
            <FiUser className="w-4 h-4" />
          </div>
          <div className="hidden md:block text-sm">
            <div className="font-medium text-gray-900 group-hover:text-[#836FFF] transition-colors">
              {user?.name || "Usuário"}
            </div>
            {user?.role && (
              <div className="mt-0.5">
                <Badge status={user.role} variant="role" />
              </div>
            )}
          </div>
          <FiChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </nav>
  );
}
