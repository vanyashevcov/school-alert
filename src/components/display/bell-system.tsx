'use client';

import { useState, useEffect } from 'react';
import * as Tone from 'tone';
import { initialBellSchedule } from '@/lib/data';
import { useInterval } from '@/hooks/use-interval';

export default function BellSystem() {
  const [schedule] = useState(initialBellSchedule);
  const [lastPlayed, setLastPlayed] = useState<string | null>(null);

  useInterval(() => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const shouldPlay = schedule.find(item => item.time === currentTime);

    if (shouldPlay && lastPlayed !== currentTime) {
      Tone.start();
      const synth = new Tone.Synth().toDestination();
      synth.triggerAttackRelease('C5', '8n', Tone.now());
      synth.triggerAttackRelease('G5', '8n', Tone.now() + 0.2);
      setLastPlayed(currentTime);
    }
  }, 1000); // Check every second to be precise

  return null; // This component has no UI
}
