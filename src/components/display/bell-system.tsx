
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
        if (player.state === 'started') {
            player.stop();
        }
        player.start();
    } else {
        console.log("Bell sound is not loaded yet.");
    }
}

export default function BellSystem({ onBellRing }: { onBellRing: (message: string) => void }) {
  const [schedule, setSchedule] = useState<LessonTime[]>([]);
  const [lastPlayed, setLastPlayed] = useState<string | null>(null);
  const bellPlayer = useRef<Tone.Player | null>(null);

  useEffect(() => {
    const baseUrl = window.location.origin;
    const player = new Tone.Player({
        url: `${baseUrl}/lesson.mp3`,
        autostart: false,
    }).toDestination();
    
    player.load(`${baseUrl}/lesson.mp3`).then(() => {
        bellPlayer.current = player;
        console.log("Bell sound loaded.");
    }).catch(err => {
        console.error("Error loading bell sound:", err);
    });
    
    return () => {
        player?.dispose();
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
      playSchoolBell(bellPlayer.current);
      setLastPlayed(currentTime);

      const isStart = shouldPlay.startTime === currentTime;
      if (!isStart) { // If it's the end of a lesson
        const currentLessonIndex = schedule.findIndex(item => item.id === shouldPlay.id);
        const nextLesson = schedule[currentLessonIndex + 1];
        
        let message = `Закінчився ${shouldPlay.lessonNumber} урок.`;
        if (nextLesson) {
            message += ` Наступний урок ${nextLesson.lessonNumber} о ${nextLesson.startTime}.`;
        } else {
            message += ` Уроки на сьогодні закінчено.`;
        }
        onBellRing(message);
      }
    }
  }, 1000); // Check every second to be precise

  return null; // This component has no UI
}
