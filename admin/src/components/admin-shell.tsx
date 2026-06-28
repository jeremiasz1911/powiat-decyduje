'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  FolderKanban,
  Map,
  Users,
  MessageSquare,
  Vote,
  Settings,
  LogOut,
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/projects', label: 'Projekty', icon: FolderKanban },
  { href: '/map', label: 'Mapa', icon: Map },
  { href: '/users', label: 'Użytkownicy', icon: Users },
  { href: '/sms', label: 'SMS-y', icon: MessageSquare },
  { href: '/votes', label: 'Głosy', icon: Vote },
  { href: '/settings', label: 'Ustawienia', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch('/api/auth/login', { method: 'DELETE' });
    router.replace('/login');
    router.refresh();
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-surface-border bg-white">
      <div className="border-b border-surface-border px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand font-bold text-white">
            PD
          </div>
          <div>
            <p className="text-sm font-bold text-ink">Powiat Decyduje</p>
            <p className="text-xs text-ink-muted">Panel administracyjny</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                active ? 'bg-brand-soft text-brand' : 'text-ink-secondary hover:bg-surface-soft'
              }`}>
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-surface-border p-3">
        <button onClick={() => void logout()} className="btn-secondary w-full">
          <LogOut size={16} />
          Wyloguj
        </button>
      </div>
    </aside>
  );
}

export function AdminShell({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-surface-border bg-white px-6 py-4">
          <h1 className="text-xl font-bold text-ink">{title}</h1>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
