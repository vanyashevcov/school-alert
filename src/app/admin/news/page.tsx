
'use client'

import NewsTickerManager from "@/components/admin/news-ticker-manager";

export default function NewsPage() {
    return (
        <div className="flex-1 pt-6 flex flex-col h-full">
            <div className="flex items-center justify-between space-y-2 p-4 md:p-8 md:pb-4">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Рядок новин</h2>
            </div>
             <div className="flex-1 pt-2 px-4 md:px-8 overflow-hidden">
                <NewsTickerManager />
            </div>
        </div>
    );
}
