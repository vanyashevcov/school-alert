
'use client'

import BellScheduleManager from "@/components/admin/bell-schedule-manager";
import ContentManager from "@/components/admin/content-manager";
import NewsTickerManager from "@/components/admin/news-ticker-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DashboardPage() {
    return (
        <div className="flex-1 space-y-4 pt-6 flex flex-col">
            <div className="flex items-center justify-between space-y-2 px-4 md:px-8">
                <h2 className="text-3xl font-bold tracking-tight">Панель керування</h2>
            </div>
            <Tabs defaultValue="content" className="flex flex-col flex-1">
                <TabsList className="mx-4 md:mx-8">
                    <TabsTrigger value="content">Керування контентом</TabsTrigger>
                    <TabsTrigger value="schedule">Розклад дзвінків</TabsTrigger>
                    <TabsTrigger value="news">Рядок новин</TabsTrigger>
                </TabsList>
                <TabsContent value="content" className="space-y-4 m-0 flex-1">
                    <ContentManager />
                </TabsContent>
                <TabsContent value="schedule" className="space-y-4 m-0 flex-1">
                    <BellScheduleManager />
                </TabsContent>
                <TabsContent value="news" className="space-y-4 m-0 flex-1">
                     <NewsTickerManager />
                </TabsContent>
            </Tabs>
        </div>
    );
}
