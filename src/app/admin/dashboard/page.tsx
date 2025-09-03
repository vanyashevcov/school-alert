
'use client'

import ContentManager from "@/components/admin/content-manager";

export default function DashboardPage() {
    return (
        <>
            <div className="flex items-center justify-between space-y-2 pb-4">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Керування контентом</h2>
            </div>
            <ContentManager />
        </>
    );
}
