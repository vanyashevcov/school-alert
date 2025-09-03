
'use client'

import EmergencyAlertManager from "@/components/admin/emergency-alert-manager";

export default function EmergencyPage() {
    return (
        <>
            <div className="flex items-center justify-between space-y-2 pb-4">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Керування аварійними тривогами</h2>
            </div>
            <EmergencyAlertManager />
        </>
    );
}
