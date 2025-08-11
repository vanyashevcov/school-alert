
'use client'

import BellScheduleManager from "@/components/admin/bell-schedule-manager";

export default function SchedulePage() {
     return (
        <div className="flex-1 pt-6 flex flex-col">
            <div className="flex items-center justify-between space-y-2 px-8">
                <h2 className="text-3xl font-bold tracking-tight">Розклад дзвінків</h2>
            </div>
            <div className="flex-1 pt-2">
                <BellScheduleManager />
            </div>
        </div>
    );
}
