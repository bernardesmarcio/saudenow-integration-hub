'use client'

import { useState } from 'react'
import { Search, Bell, Settings, User, Moon, Sun, Command } from 'lucide-react'
import { cn } from '../../lib/utils'
import { Button } from '../ui/button'
import { Input } from '../ui/input'

interface HeaderProps {
  title: string
  description?: string
  className?: string
}

export function Header({ title, description, className }: HeaderProps) {
  const [darkMode, setDarkMode] = useState(false)
  const [notifications, setNotifications] = useState(3)

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    // Here you would implement actual dark mode toggle
    document.documentElement.classList.toggle('dark')
  }

  return (
    <header className={cn(
      'sticky top-0 z-40 border-b border-gray-200/60 bg-white/80 backdrop-blur-xl',
      className
    )}>
      <div className="flex h-16 items-center justify-between px-6">
        {/* Left section - Title */}
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 gradient-text">{title}</h1>
            {description && (
              <p className="text-sm text-gray-500">{description}</p>
            )}
          </div>
        </div>

        {/* Center section - Search */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Pesquisar... (Cmd+K)"
              className="pl-10 pr-4 bg-gray-50/80 border-gray-200/60 focus:bg-white focus:border-brand-300 transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <kbd className="inline-flex h-5 select-none items-center gap-1 rounded border border-gray-200 bg-gray-100 px-1.5 text-[10px] font-medium text-gray-500">
                <Command className="h-3 w-3" />
                K
              </kbd>
            </div>
          </div>
        </div>

        {/* Right section - Actions */}
        <div className="flex items-center space-x-3">
          {/* Dark mode toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleDarkMode}
            className="h-9 w-9 p-0 hover:bg-gray-100/80"
          >
            {darkMode ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="sm"
            className="relative h-9 w-9 p-0 hover:bg-gray-100/80"
          >
            <Bell className="h-4 w-4" />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-error-500 text-[10px] font-medium text-white animate-pulse">
                {notifications}
              </span>
            )}
          </Button>

          {/* Settings */}
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 hover:bg-gray-100/80"
          >
            <Settings className="h-4 w-4" />
          </Button>

          {/* Divider */}
          <div className="h-6 w-px bg-gray-200" />

          {/* User menu */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">Admin</p>
              <p className="text-xs text-gray-500">admin@saudenow.com</p>
            </div>
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg">
              <User className="h-4 w-4 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar for loading states */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-200/60">
        <div className="h-full w-0 bg-gradient-to-r from-brand-500 to-brand-600 transition-all duration-300" />
      </div>
    </header>
  )
}