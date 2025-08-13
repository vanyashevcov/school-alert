
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
  const [airRaidAlert, setAirRaidAlert] = useState<AirRaidAlertOutput | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastAlertStatus, setLastAlertStatus] = useState<boolean | null>(null);
  const [fireAlert, setFireAlert] = useState<EmergencyAlert | null>(null);
  
  const fireAlarmPlayer = useRef<Tone.Player | null>(null);
  const airRaidPlayer = useRef<Tone.Player | null>(null);


   useEffect(() => {
    airRaidPlayer.current = new Tone.Player({
      url: "/Air-raid-siren.mp3",
      loop: false,
      autostart: false,
    }).toDestination();
    
    fireAlarmPlayer.current = new Tone.Player({
      url: "/signal-pojarnoy-trevogi.mp3",
      autostart: false,
      loop: true,
    }).toDestination();

    return () => {
        airRaidPlayer.current?.dispose();
        fireAlarmPlayer.current?.dispose();
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
      setAirRaidAlert({ shouldAlert, reason: shouldAlert ? reason : 'Відбій тривоги' });
    } catch (error) {
      console.error('Error fetching air raid status:', error);
      setAirRaidAlert({ shouldAlert: false, reason: 'Помилка отримання даних.' });
    } finally {
      setIsChecking(false);
    }
  };
  
  useEffect(() => {
    checkAlerts();
  }, []);
  
  useInterval(checkAlerts, 60000); 

  const playAirRaidSound = () => {
    if (Tone.context.state !== 'running' || !airRaidPlayer.current || !airRaidPlayer.current.loaded) return;
    if (airRaidPlayer.current.state !== 'started') {
        airRaidPlayer.current.start();
    }
  };
  
  const stopAirRaidSound = () => {
    airRaidPlayer.current?.stop();
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
        if (airRaidAlert?.shouldAlert) {
            if (lastAlertStatus === false || lastAlertStatus === null) {
                playAirRaidSound();
            }
        } else {
            stopAirRaidSound();
        }
    }
    
    if (airRaidAlert) {
        setLastAlertStatus(airRaidAlert.shouldAlert);
    }

  }, [airRaidAlert, lastAlertStatus, fireAlert]);

  const isAnyAlertActive = fireAlert?.isActive || (airRaidAlert?.shouldAlert ?? false);


  return (
    <div className="relative flex h-full w-full flex-col">
      <AudioEnabler />
      <BellSystem />
      <header className="absolute top-4 left-4 right-4 z-10 flex items-start justify-between">
        <div className="bg-black/20 p-4 rounded-lg">
          <TimeAndDate />
        </div>
        <AirRaidAlert alertState={airRaidAlert} />
      </header>
      <main className="flex-1">
        <Slideshow isAlertActive={isAnyAlertActive} fireAlert={fireAlert} airRaidAlert={airRaidAlert}/>
      </main>
      <footer className="absolute bottom-0 left-0 right-0 z-10 h-16">
        <NewsTicker />
      </footer>
    </div>
  );
}
