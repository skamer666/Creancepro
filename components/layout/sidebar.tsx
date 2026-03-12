'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  Settings,
  TrendingUp,
  Bell,
  ChevronRight,
} from 'lucide-react'

const navItems = [
  {
    label: 'Tableau de bord',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Dossiers',
    href: '/dossiers',
    icon: FolderOpen,
  },
  {
    label: 'Mises en demeure',
    href: '/mise-en-demeure',
    icon: FileText,
  },
  {
    label: 'Rapports',
    href: '/rapports',
    icon: TrendingUp,
  },
  {
    label: 'Paramètres',
    href: '/parametres',
    icon: Settings,
  },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-slate-700">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">CP</span>
          </div>
          <span className="font-bold text-lg">CréancePro</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <item.icon size={18} />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight size={14} className="opacity-60" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <div className="text-xs text-slate-500 text-center">
          © 2024 CréancePro
        </div>
      </div>
    </aside>
  )
}
