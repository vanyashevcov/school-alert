
'use client'

import BellScheduleManager from "@/components/admin/bell-schedule-manager";

export default function SchedulePage() {
     return (
        <div className="flex-1 flex flex-col">
            <div className="flex-1">
                <BellScheduleManager />
            </div>
        </div>
    );
}
