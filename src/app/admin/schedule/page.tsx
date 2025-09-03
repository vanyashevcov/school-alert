
'use client'

import BellScheduleManager from "@/components/admin/bell-schedule-manager";

export default function SchedulePage() {
     return (
        <div className="flex flex-col">
            <div className="flex items-center justify-between space-y-2 pb-4">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Розклад дзвінків</h2>
            </div>
            <div className="flex-1">
                <BellScheduleManager />
            </div>
        </div>
    );
}
