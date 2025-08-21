
'use client'

import VideoManager from "@/components/admin/video-manager";

export default function VideoPage() {
    return (
        <div className="flex-1 pt-6 flex flex-col">
            <div className="flex items-center justify-between space-y-2 px-8">
                <h2 className="text-3xl font-bold tracking-tight">Ранкове відео</h2>
            </div>
             <div className="flex-1 pt-2">
                <VideoManager />
            </div>
        </div>
    );
}
