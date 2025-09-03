
'use client'

import NewsTickerManager from "@/components/admin/news-ticker-manager";

export default function NewsPage() {
    return (
        <div className="flex flex-col">
            <div className="flex items-center justify-between space-y-2 pb-4">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Рядок новин</h2>
            </div>
            <NewsTickerManager />
        </div>
    );
}
