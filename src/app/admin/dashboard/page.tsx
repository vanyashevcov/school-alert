
'use client'

import ContentManager from "@/components/admin/content-manager";

export default function DashboardPage() {
    return (
        <div className="flex flex-col h-full flex-1">
            <div className="flex items-center justify-between space-y-2 p-4 pt-6 md:p-8 md:pt-6 md:pb-4">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Керування контентом</h2>
            </div>
            <div className="flex-1 overflow-auto p-4 md:p-8 md:pt-0">
               <ContentManager />
            </div>
        </div>
    );
}
