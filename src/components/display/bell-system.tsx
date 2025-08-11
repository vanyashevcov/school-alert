
'use client';

import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { useInterval } from '@/hooks/use-interval';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { LessonTime, DayOfWeek } from '@/lib/types';
import { format, getDay } from 'date-fns';

const dayMapping: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function playSchoolBell(player: Tone.Player | null) {
    if (Tone.context.state !== 'running' || !player) return;
    
    if (player.loaded) {
        player.start();
    } else {
        console.log("Bell sound is not loaded yet.");
        // Optional: play a fallback sound if the player is not ready
        const synth = new Tone.Synth().toDestination();
        synth.triggerAttackRelease("C5", "1s");
    }
}

export default function BellSystem() {
  const [schedule, setSchedule] = useState<LessonTime[]>([]);
  const [lastPlayed, setLastPlayed] = useState<string | null>(null);
  const bellPlayer = useRef<Tone.Player | null>(null);

  useEffect(() => {
    // Initialize the player only on the client side
    bellPlayer.current = new Tone.Player({
        url: "https://zvukitop.com/wp-content/uploads/2021/03/zvuk-shkolnogo-zvonka-ygbb.mp3",
        autostart: false,
    }).toDestination();
    
    return () => {
        bellPlayer.current?.dispose();
    }
  }, []);

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
      
      playSchoolBell(bellPlayer.current);

      setLastPlayed(currentTime);
    }
  }, 1000); // Check every second to be precise

  return null; // This component has no UI
}
