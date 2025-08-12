
'use client';

import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import AirRaidAlert from '@/components/display/air-raid-alert';
import AudioEnabler from '@/components/display/audio-enabler';
import BellSystem from '@/components/display/bell-system';
import NewsTicker from '@/components/display/news-ticker';
import Slideshow from '@/components/display/slideshow';
import TimeAndDate from '@/components/display/time-and-date';
import { useInterval } from '@/hooks/use-interval';
import { getPoltavaAlertStatus } from '@/lib/actions';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { EmergencyAlert } from '@/lib/types';

export interface AirRaidAlertOutput {
  shouldAlert: boolean;
  reason: string;
}

export default function Home() {
  const [alertState, setAlertState] = useState<AirRaidAlertOutput | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastAlertStatus, setLastAlertStatus] = useState<boolean | null>(null);
  const [fireAlert, setFireAlert] = useState<EmergencyAlert | null>(null);
  
  const fireAlarmPlayer = useRef<Tone.Player | null>(null);
  const airRaidSynth = useRef<Tone.Synth | null>(null);
  const airRaidInterval = useRef<ReturnType<typeof setInterval> | null>(null);


   useEffect(() => {
    airRaidSynth.current = new Tone.Synth({
        oscillator: { type: "sawtooth" },
        envelope: { attack: 0.5, decay: 0.1, sustain: 1, release: 0.5 }
    }).toDestination();
    
    fireAlarmPlayer.current = new Tone.Player({
      url: "https://www.myinstants.com/media/sounds/school-fire-alarm-sound-effect-hd.mp3",
      autostart: false,
      loop: true,
    }).toDestination();

    return () => {
        airRaidSynth.current?.dispose();
        fireAlarmPlayer.current?.dispose();
        if (airRaidInterval.current) {
            clearInterval(airRaidInterval.current);
        }
    }
  }, []);

  useEffect(() => {
    const fireAlertDocRef = doc(db, 'emergencyAlerts', 'fireAlarm');
    const unsubscribe = onSnapshot(fireAlertDocRef, (doc) => {
      if (doc.exists()) {
        setFireAlert(doc.data() as EmergencyAlert);
      } else {
        setFireAlert({ id: 'fireAlarm', isActive: false, message: 'Увага! Пожежна тривога! Негайно покиньте приміщення, слідуючи плану евакуації.'});
      }
    });
    return () => unsubscribe();
  }, []);

  const checkAlerts = async () => {
    if (isChecking) return;
    setIsChecking(true);
    try {
      const status = await getPoltavaAlertStatus();
      const shouldAlert = status === 'A' || status === 'P';
      const reason = status === 'A' ? 'Тривога у м. Полтава' : 'Часткова тривога';
      setAlertState({ shouldAlert, reason: shouldAlert ? reason : 'Відбій тривоги' });
    } catch (error) {
      console.error('Error fetching air raid status:', error);
      setAlertState({ shouldAlert: false, reason: 'Помилка отримання даних.' });
    } finally {
      setIsChecking(false);
    }
  };
  
  useEffect(() => {
    checkAlerts();
  }, []);
  
  useInterval(checkAlerts, 60000); 

  const playAirRaidSound = () => {
    if (Tone.context.state !== 'running' || !airRaidSynth.current || airRaidInterval.current) return;
    
    const pattern = [440, 880];
    let index = 0;

    const playNote = () => {
        if (!airRaidSynth.current) return;
        airRaidSynth.current.triggerAttack(pattern[index]);
        index = (index + 1) % pattern.length;
    }

    playNote(); // Play immediately
    airRaidInterval.current = setInterval(playNote, 5000);
  };
  
  const stopAirRaidSound = () => {
    if (airRaidInterval.current) {
      clearInterval(airRaidInterval.current);
      airRaidInterval.current = null;
    }
    airRaidSynth.current?.triggerRelease();
  };

  useEffect(() => {
    const playFireSound = (player: Tone.Player | null) => {
        if (Tone.context.state !== 'running' || !player || !player.loaded) return;
        if (player.state !== 'started') {
            player.start();
        }
    }
    
    if (fireAlert?.isActive) {
        stopAirRaidSound();
        playFireSound(fireAlarmPlayer.current);
    } else {
        fireAlarmPlayer.current?.stop();
        if (alertState?.shouldAlert) {
            if (lastAlertStatus === false || lastAlertStatus === null) {
                playAirRaidSound();
            }
        } else {
            stopAirRaidSound();
        }
    }
    
    if (alertState) {
        setLastAlertStatus(alertState.shouldAlert);
    }

  }, [alertState, lastAlertStatus, fireAlert]);

  const isAnyAlertActive = fireAlert?.isActive || (alertState?.shouldAlert ?? false);


  return (
    <div className="relative flex h-full w-full flex-col">
      <AudioEnabler />
      <BellSystem />
      <header className="absolute top-4 left-4 right-4 z-10 flex items-start justify-between">
        <div className="bg-black/20 p-4 rounded-lg">
          <TimeAndDate />
        </div>
        <AirRaidAlert alertState={alertState} />
      </header>
      <main className="flex-1">
        <Slideshow isAlertActive={isAnyAlertActive} fireAlert={fireAlert} airRaidAlert={alertState}/>
      </main>
      <footer className="absolute bottom-0 left-0 right-0 z-10 h-16">
        <NewsTicker />
      </footer>
    </div>
  );
}
