"use client";

import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { SystemHealthBanner } from "./SystemHealthBanner";
import { cn } from "../../lib/utils";

interface MainLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  className?: string;
}

export function MainLayout({
  children,
  title,
  description,
  className,
}: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50/30">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* System Health Banner */}
        <SystemHealthBanner />

        {/* Header */}
        <Header title={title} description={description} />

        {/* Content */}
        <main className={cn("flex-1 overflow-y-auto p-6 space-y-6", className)}>
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
