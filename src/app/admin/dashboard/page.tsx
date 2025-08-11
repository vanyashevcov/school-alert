
'use client'

import BellScheduleManager from "@/components/admin/bell-schedule-manager";
import ContentManager from "@/components/admin/content-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function DashboardPage() {
    return (
        <div className="flex-1 space-y-4 pt-6">
            <div className="flex items-center justify-between space-y-2 px-4 md:px-8">
                <h2 className="text-3xl font-bold tracking-tight">Панель керування</h2>
            </div>
            <Tabs defaultValue="content" className="space-y-4">
                <TabsList className="mx-4 md:mx-8">
                    <TabsTrigger value="content">Керування контентом</TabsTrigger>
                    <TabsTrigger value="schedule">Розклад дзвінків</TabsTrigger>
                </TabsList>
                <TabsContent value="content" className="space-y-4 m-0">
                    <div className="p-4 md:p-8 pt-0">
                        <ContentManager />
                    </div>
                </TabsContent>
                <TabsContent value="schedule" className="space-y-4 m-0">
                    <BellScheduleManager />
                </TabsContent>
            </Tabs>
        </div>
    );
}
