
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

async function checkPoltavaAlert(): Promise<AirRaidAlertOutput> {
  try {
    const status = await getPoltavaAlertStatus();

    switch (status) {
      case 'A':
        return {
          shouldAlert: true,
          reason: `Тривога у м. Полтава`,
        };
      case 'P': // Partial alert in the oblast, but we treat it as a full alert for the city for safety
        return {
          shouldAlert: true,
          reason: `Часткова тривога у Полтавській області`,
        };
      case 'N':
        return {
          shouldAlert: false,
          reason: 'Відбій тривоги',
        };
      default:
        // This can happen if the API returns an error message or unexpected value like a space
        console.warn('Unexpected response from alerts API:', status);
        return { shouldAlert: false, reason: 'Помилка формату даних.' };
    }
  } catch (error) {
    console.error('Error fetching air raid status:', error);
    return { shouldAlert: false, reason: 'Помилка отримання даних.' };
  }
}

export default function Home() {
  const [alertState, setAlertState] = useState<AirRaidAlertOutput | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastAlertStatus, setLastAlertStatus] = useState<boolean | null>(null);
  const [fireAlert, setFireAlert] = useState<EmergencyAlert | null>(null);
  
  const fireAlarmPlayer = useRef<Tone.Player | null>(null);
  const airRaidSynth = useRef<Tone.Synth | null>(null);
  const airRaidInterval = useRef<NodeJS.Timeout | null>(null);


   useEffect(() => {
    airRaidSynth.current = new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.1, decay: 0.1, sustain: 1, release: 0.5 }
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
      const analysis = await checkPoltavaAlert();
      setAlertState(analysis);
    } catch (error) {
      console.error('Error analyzing air raid alert:', error);
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
    
    let up = true;
    let freq = 400; // стартова частота
    airRaidInterval.current = setInterval(() => {
        if (!airRaidSynth.current) return;
        airRaidSynth.current.triggerAttack(freq);
        if (up) {
            freq += 20;
            if (freq > 800) up = false;
        } else {
            freq -= 20;
            if (freq < 400) up = true;
        }
    }, 100);
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
