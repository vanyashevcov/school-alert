
'use client'

import EmergencyAlertManager from "@/components/admin/emergency-alert-manager";

export default function EmergencyPage() {
    return (
        <div className="flex-1 pt-6 flex flex-col">
            <div className="flex items-center justify-between space-y-2 px-8">
                <h2 className="text-3xl font-bold tracking-tight">Керування аварійними тривогами</h2>
            </div>
             <div className="flex-1 pt-2">
                <EmergencyAlertManager />
            </div>
        </div>
    );
}
