'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Package,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/contagens', label: 'Contagens', icon: ClipboardList },
  { href: '/produtos', label: 'Produtos', icon: Package },
];

function NavLinks({ onClick }: { onClick?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => (
        <Link key={item.href} href={item.href} onClick={onClick}>
          <Button
            variant={pathname === item.href ? 'secondary' : 'ghost'}
            className={cn(
              'w-full justify-start gap-2',
              pathname === item.href && 'font-semibold',
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Button>
        </Link>
      ))}
    </nav>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { employee, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !employee) {
      router.push('/login');
    }
  }, [isLoading, employee, router]);

  if (isLoading || !employee) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - Desktop */}
      <aside className="hidden w-64 flex-shrink-0 border-r bg-card md:flex md:flex-col">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Package className="h-5 w-5 text-primary" />
          <span className="font-semibold">Estoque</span>
        </div>
        <div className="flex flex-1 flex-col justify-between p-3">
          <NavLinks />
          <div>
            <Separator className="mb-3" />
            <div className="mb-2 px-3 text-sm text-muted-foreground truncate">
              {employee.nome}
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-muted-foreground"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Top bar - Mobile */}
        <header className="flex h-14 items-center gap-2 border-b px-4 md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-3">
              <div className="flex items-center gap-2 mb-4 px-1">
                <Package className="h-5 w-5 text-primary" />
                <span className="font-semibold">Estoque</span>
              </div>
              <NavLinks />
              <div className="mt-auto pt-4">
                <Separator className="mb-3" />
                <div className="mb-2 px-3 text-sm text-muted-foreground">
                  {employee.nome}
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 text-muted-foreground"
                  onClick={logout}
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          <span className="font-semibold">Estoque</span>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
