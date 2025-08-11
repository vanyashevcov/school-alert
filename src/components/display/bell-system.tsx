
'use client';

import { useState, useEffect } from 'react';
import * as Tone from 'tone';
import { useInterval } from '@/hooks/use-interval';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { BellTime, DayOfWeek } from '@/lib/types';
import { format } from 'date-fns';

const dayMapping: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export default function BellSystem() {
  const [schedule, setSchedule] = useState<BellTime[]>([]);
  const [lastPlayed, setLastPlayed] = useState<string | null>(null);

  useEffect(() => {
    const today = dayMapping[new Date().getDay()];
    const q = query(collection(db, 'bellSchedule'), where('day', '==', today), orderBy('time', 'asc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const scheduleData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as BellTime[];
        setSchedule(scheduleData);
    });

    // Each day at midnight, refetch the schedule for the new day
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    const dailyTimer = setTimeout(() => {
        window.location.reload(); // Simple way to refetch everything for the new day
    }, msUntilMidnight);

    return () => {
        unsubscribe();
        clearTimeout(dailyTimer);
    }
  }, []);

  useInterval(() => {
    const now = new Date();
    const currentTime = format(now, 'HH:mm');

    const shouldPlay = schedule.find(item => item.time === currentTime);

    if (shouldPlay && lastPlayed !== currentTime) {
      console.log(`Playing bell for ${shouldPlay.label} at ${shouldPlay.time}`);
      Tone.start();
      const synth = new Tone.Synth().toDestination();
      synth.triggerAttackRelease('C5', '8n', Tone.now());
      synth.triggerAttackRelease('G5', '8n', Tone.now() + 0.2);
      setLastPlayed(currentTime);
    }
  }, 1000); // Check every second to be precise

  return null; // This component has no UI
}
