'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { uk } from 'date-fns/locale';

export default function TimeAndDate() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    // Set initial time
    setCurrentTime(new Date());

    return () => {
      clearInterval(timer);
    };
  }, []);

  if (!currentTime) {
    return (
      <div className="text-white">
        <div className="text-6xl font-black">--:--:--</div>
        <div className="text-2xl font-bold">Завантаження...</div>
      </div>
    );
  }

  return (
    <div className="text-white drop-shadow-lg">
      <div className="text-6xl font-black tabular-nums">
        {format(currentTime, 'HH:mm:ss')}
      </div>
      <div className="text-2xl font-bold capitalize">
        {format(currentTime, 'eeee, d MMMM yyyy', { locale: uk })}
      </div>
    </div>
  );
}
