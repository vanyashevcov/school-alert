
'use client'

import EmergencyAlertManager from "@/components/admin/emergency-alert-manager";

export default function EmergencyPage() {
    return (
        <div className="flex-1 flex flex-col h-full">
            <div className="flex items-center justify-between space-y-2 p-4 pt-6 md:p-8 md:pt-6 md:pb-4">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Керування аварійними тривогами</h2>
            </div>
             <div className="flex-1 pt-2 overflow-y-auto p-4 md:p-8 md:pt-0">
                <EmergencyAlertManager />
            </div>
        </div>
    );
}
