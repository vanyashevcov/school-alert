
'use client'

import NewsTickerManager from "@/components/admin/news-ticker-manager";

export default function NewsPage() {
    return (
        <div className="flex-1 pt-6 flex flex-col">
            <div className="flex items-center justify-between space-y-2 px-8">
                <h2 className="text-3xl font-bold tracking-tight">Рядок новин</h2>
            </div>
             <div className="flex-1 pt-2">
                <NewsTickerManager />
            </div>
        </div>
    );
}
