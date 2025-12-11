"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSystemHealth } from "../../hooks/useSystemHealth";
import { cn } from "../../lib/utils";
import {
  LayoutDashboard,
  Package,
  Settings,
  Activity,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Zap,
  Shield,
  Users,
  Bell,
  HelpCircle,
  LogOut,
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
    description: "Visão geral do sistema",
  },
  {
    name: "Retail Pro",
    href: "/retail-pro",
    icon: Package,
    description: "Gestão de estoque",
    children: [
      { name: "Produtos", href: "/retail-pro", icon: Package },
      { name: "Dashboard", href: "/retail-pro/dashboard", icon: BarChart3 },
    ],
  },
  {
    name: "Integrações",
    href: "/integrations",
    icon: Zap,
    description: "Conectores e APIs",
  },
  {
    name: "Monitoramento",
    href: "/monitoring",
    icon: Activity,
    description: "Logs e métricas",
  },
  {
    name: "Usuários",
    href: "/users",
    icon: Users,
    description: "Gestão de acesso",
  },
  {
    name: "Configurações",
    href: "/settings",
    icon: Settings,
    description: "Configurações do sistema",
  },
];

const bottomNavigation = [
  { name: "Notificações", href: "/notifications", icon: Bell },
  { name: "Ajuda", href: "/help", icon: HelpCircle },
  { name: "Sair", href: "/logout", icon: LogOut },
];

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const pathname = usePathname();
  const { systemHealth } = useSystemHealth();

  const toggleCollapsed = () => setCollapsed(!collapsed);

  return (
    <div
      className={cn(
        "group relative flex h-screen flex-col bg-white/80 backdrop-blur-xl border-r border-gray-200/60 transition-all duration-300 ease-in-out",
        collapsed ? "w-16" : "w-72",
        className,
      )}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50/50 to-white/80 -z-10" />

      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200/60">
        <div
          className={cn(
            "flex items-center space-x-3 transition-opacity duration-300",
            collapsed && "opacity-0",
          )}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg">
            <Shield className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold text-gray-900">SaudeNow</h1>
              <p className="text-xs text-gray-500">Integration Hub</p>
            </div>
          )}
        </div>

        <button
          onClick={toggleCollapsed}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200/60 bg-white/60 text-gray-500 transition-all hover:bg-gray-50 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const hasChildren = item.children && item.children.length > 0;

          return (
            <div key={item.name}>
              <Link
                href={item.href}
                onMouseEnter={() => setHoveredItem(item.name)}
                onMouseLeave={() => setHoveredItem(null)}
                className={cn(
                  "group relative flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-lg shadow-brand-500/25"
                    : "text-gray-700 hover:bg-gray-100/80 hover:text-gray-900",
                  collapsed && "justify-center px-2",
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-transform",
                    !collapsed && "mr-3",
                    isActive && "scale-110",
                    hoveredItem === item.name && !isActive && "scale-105",
                  )}
                />

                {!collapsed && (
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span>{item.name}</span>
                      {hasChildren && (
                        <ChevronRight className="h-4 w-4 opacity-60" />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs opacity-75">
                      {item.description}
                    </p>
                  </div>
                )}

                {/* Active indicator */}
                {isActive && (
                  <div className="absolute -right-3 top-1/2 h-6 w-1 -translate-y-1/2 rounded-l-full bg-white" />
                )}

                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute left-full ml-4 z-50 hidden group-hover:block">
                    <div className="rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-gray-300">{item.description}</div>
                    </div>
                  </div>
                )}
              </Link>

              {/* Sub-navigation */}
              {hasChildren && !collapsed && isActive && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.children?.map((child) => (
                    <Link
                      key={child.name}
                      href={child.href}
                      className={cn(
                        "flex items-center rounded-lg px-3 py-2 text-sm transition-all",
                        pathname === child.href
                          ? "bg-brand-50 text-brand-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                      )}
                    >
                      <child.icon className="mr-2 h-4 w-4" />
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-gray-200/60 p-3">
        {/* Status indicator */}
        <div
          className={cn(
            "mb-3 flex items-center rounded-lg border border-gray-200/60 bg-white/60 p-3 transition-all",
            collapsed && "justify-center p-2",
          )}
        >
          <div
            className={`status-dot ${
              systemHealth.overall === "healthy"
                ? "healthy"
                : systemHealth.overall === "degraded"
                  ? "warning"
                  : "error"
            } ${systemHealth.overall === "healthy" ? "animate-pulse" : ""}`}
          />
          {!collapsed && (
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">
                {systemHealth.overall === "healthy"
                  ? "Sistema Online"
                  : systemHealth.overall === "degraded"
                    ? "Sistema Degradado"
                    : "Sistema Crítico"}
              </p>
              <p className="text-xs text-gray-500">
                {
                  systemHealth.services.filter((s) => s.status === "online")
                    .length
                }
                /{systemHealth.services.length} serviços ativos
              </p>
            </div>
          )}
        </div>

        {/* Bottom navigation */}
        <div className="space-y-1">
          {bottomNavigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "group flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-all hover:bg-gray-100/80 hover:text-gray-900",
                collapsed && "justify-center px-2",
              )}
            >
              <item.icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
              {!collapsed && <span>{item.name}</span>}

              {collapsed && (
                <div className="absolute left-full ml-4 z-50 hidden group-hover:block">
                  <div className="rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg">
                    {item.name}
                  </div>
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
