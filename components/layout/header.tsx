'use client'

import { signOut } from 'next-auth/react'
import { Bell, LogOut, User, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

interface HeaderProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export default function Header({ user }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="text-slate-800 font-semibold">
          Bienvenue, {user.name?.split(' ')[0] || 'Utilisateur'}
        </h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <User size={16} className="text-blue-600" />
            </div>
            <span className="text-sm font-medium hidden md:block">{user.email}</span>
            <ChevronDown size={16} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50">
              <Link
                href="/parametres"
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
                onClick={() => setMenuOpen(false)}
              >
                <User size={16} />
                Paramètres
              </Link>
              <hr className="border-slate-100" />
              <button
                onClick={() => signOut({ callbackUrl: '/auth/login' })}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 w-full text-left"
              >
                <LogOut size={16} />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
