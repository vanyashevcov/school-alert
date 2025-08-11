
'use client';

import { useState, useEffect } from 'react';
import * as Tone from 'tone';
import { useInterval } from '@/hooks/use-interval';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { LessonTime, DayOfWeek } from '@/lib/types';
import { format, getDay } from 'date-fns';

const dayMapping: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export default function BellSystem() {
  const [schedule, setSchedule] = useState<LessonTime[]>([]);
  const [lastPlayed, setLastPlayed] = useState<string | null>(null);

  useEffect(() => {
    const today = dayMapping[getDay(new Date())];
    const q = query(collection(db, 'lessonSchedule'), where('day', '==', today));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const scheduleData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as LessonTime[];
        scheduleData.sort((a, b) => a.startTime.localeCompare(b.startTime));
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
    if (Tone.context.state !== 'running') return;

    const now = new Date();
    const currentTime = format(now, 'HH:mm');

    const shouldPlay = schedule.find(item => item.startTime === currentTime || item.endTime === currentTime);

    if (shouldPlay && lastPlayed !== currentTime) {
      const isStart = shouldPlay.startTime === currentTime;
      const label = isStart ? `Початок уроку ${shouldPlay.lessonNumber}` : `Кінець уроку ${shouldPlay.lessonNumber}`;
      console.log(`Playing bell for ${label} at ${currentTime}`);
      
      const synth = new Tone.Synth().toDestination();
      
      if (isStart) {
        // A simple two-tone melody for the start
        synth.triggerAttackRelease('C5', '8n', Tone.now());
        synth.triggerAttackRelease('G5', '8n', Tone.now() + 0.2);
      } else {
        // A single, slightly longer tone for the end
        synth.triggerAttackRelease('G5', '4n', Tone.now());
      }

      setLastPlayed(currentTime);
    }
  }, 1000); // Check every second to be precise

  return null; // This component has no UI
}
