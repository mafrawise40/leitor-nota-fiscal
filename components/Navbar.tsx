"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Camera, 
  History, 
  LayoutDashboard, 
  ReceiptText, 
  ArrowDownUp,
  Store // Ícone para Estabelecimentos
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Comparador", href: "/comparador", icon: ArrowDownUp },
    { name: "Mercados", href: "/estabelecimentos", icon: Store }, // Nova Rota
    { name: "Escanear", href: "/upload", icon: Camera },
    { name: "Histórico", href: "/historico", icon: History },
  ];

  return (
    <>
      {/* MENU DESKTOP (Topo) */}
      <nav className="hidden md:block bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-green-600 p-2 rounded-xl">
              <ReceiptText className="text-white" size={24} />
            </div>
            <span className="font-black text-xl tracking-tighter text-gray-900 italic">
              POUPA<span className="text-green-600">IA</span>
            </span>
          </div>

          {/* Ajustei o gap para acomodar o novo item sem quebrar o layout */}
          <div className="flex items-center gap-5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={`flex items-center gap-2 font-black text-[10px] uppercase tracking-wider transition-all ${
                    isActive ? "text-green-600" : "text-gray-400 hover:text-gray-900"
                  }`}
                >
                  <Icon size={16} strokeWidth={isActive ? 3 : 2} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* MENU MOBILE (Barra Inferior Fixa) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 py-2 z-50 flex justify-between items-center pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex flex-col items-center gap-1 flex-1 transition-all ${
                isActive ? "text-green-600" : "text-gray-300"
              }`}
            >
              <div className={`p-2 rounded-2xl transition-colors ${isActive ? "bg-green-50" : ""}`}>
                <Icon size={20} strokeWidth={isActive ? 3 : 2} />
              </div>
              <span className={`text-[8px] font-black uppercase tracking-tight ${isActive ? "text-green-600" : "text-gray-400"}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}