
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { NewsItem } from '@/lib/types';
import { Newspaper } from 'lucide-react';

export default function NewsTicker() {
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'newsItems'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as NewsItem[];
      setNews(newsData);
    });
    return () => unsubscribe();
  }, []);

  if (news.length === 0) {
    return null; // Don't render anything if there's no news
  }

  const allNewsText = news.map(item => item.text).join('   *   ');

  return (
    <div className="bg-primary text-primary-foreground h-full flex items-center overflow-hidden">
      <div className="flex-shrink-0 px-6 flex items-center gap-2">
        <Newspaper />
        <span className="font-bold">НОВИНИ:</span>
      </div>
      <div className="flex-1 relative h-full flex items-center overflow-hidden">
        <p 
          className="text-2xl font-semibold absolute whitespace-nowrap animate-marquee"
          style={{
            animationDuration: `${news.length * 25}s`
          }}
        >
          {allNewsText}
        </p>
      </div>
    </div>
  );
}
