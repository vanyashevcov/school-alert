
'use client';

import { FileVideo, BellRing, School, LogOut, Newspaper, TriangleAlert, Clapperboard } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
  SidebarTrigger
} from '@/components/ui/sidebar';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useEffect } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/admin');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await auth.signOut();
    toast({ title: "Ви вийшли з системи." });
    router.push('/admin');
  };

  if (loading || !user) {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <p>Завантаження...</p>
        </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
            <SidebarHeader className="p-4">
                <Link href="/admin/dashboard" className="flex items-center gap-2">
                    <div className="p-2 bg-sidebar-primary rounded-lg text-sidebar-primary-foreground">
                        <School />
                    </div>
                    <span className="font-bold text-lg group-data-[collapsible=icon]:hidden">School Hub</span>
                </Link>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    <SidebarMenuItem>
                      <Link href="/admin/dashboard">
                          <SidebarMenuButton tooltip="Керування контентом" isActive={pathname === '/admin/dashboard'}>
                              <FileVideo />
                              <span className="truncate">Контент</span>
                          </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                       <Link href="/admin/schedule">
                          <SidebarMenuButton tooltip="Розклад дзвінків" isActive={pathname === '/admin/schedule'}>
                              <BellRing />
                              <span className="truncate">Дзвінки</span>
                          </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <Link href="/admin/news">
                          <SidebarMenuButton tooltip="Рядок новин" isActive={pathname === '/admin/news'}>
                              <Newspaper />
                              <span className="truncate">Новини</span>
                          </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                     <SidebarMenuItem>
                       <Link href="/admin/emergency">
                           <SidebarMenuButton tooltip="Аварійні тривоги" isActive={pathname === '/admin/emergency'}>
                              <TriangleAlert />
                              <span className="truncate">Тривоги</span>
                           </SidebarMenuButton>
                       </Link>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <Link href="/admin/video">
                          <SidebarMenuButton tooltip="Ранкове відео" isActive={pathname === '/admin/video'}>
                              <Clapperboard />
                              <span className="truncate">Ранкове відео</span>
                          </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                     <SidebarMenuItem>
                        <SidebarMenuButton onClick={handleLogout}>
                            <LogOut />
                            <span className="truncate">Вийти</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
        <SidebarInset>
            <div className="flex flex-col h-full w-full">
                <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
                    <SidebarTrigger className="md:hidden" />
                    <h1 className="text-xl font-semibold">Адмін-панель</h1>
                </header>
                <main className="flex-1 overflow-y-auto p-4 md:p-6 w-full">
                    {children}
                </main>
            </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
