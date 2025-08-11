
'use client';

import { FileVideo, BellRing, School, LogOut, Newspaper } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter
} from '@/components/ui/sidebar';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useEffect } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
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
                    <div className="p-2 bg-primary rounded-lg text-primary-foreground">
                        <School />
                    </div>
                    <span className="font-bold text-lg group-data-[collapsible=icon]:hidden">School Hub</span>
                </Link>
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton tooltip="Керування контентом" href="/admin/dashboard">
                            <FileVideo />
                            <span className="truncate">Контент</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton tooltip="Розклад дзвінків" href="/admin/dashboard?tab=schedule">
                            <BellRing />
                            <span className="truncate">Дзвінки</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton tooltip="Рядок новин" href="/admin/dashboard?tab=news">
                            <Newspaper />
                            <span className="truncate">Новини</span>
                        </SidebarMenuButton>
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
            <main className="flex-1 bg-background">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
