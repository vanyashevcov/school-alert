
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
import { collection, onSnapshot } from 'firebase/firestore';
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
  const [miningAlert, setMiningAlert] = useState<EmergencyAlert | null>(null);
  
  const fireAlarmPlayer = useRef<Tone.Player | null>(null);
  const airRaidPlayer = useRef<Tone.Player | null>(null);
  const miningPlayer = useRef<Tone.Player | null>(null);

  const playSound = (player: Tone.Player | null, times: number) => {
    if (Tone.context.state !== 'running' || !player || !player.loaded) return;
    
    player.loop = false; // Ensure it doesn't loop infinitely on its own
    let count = 0;
    const playOnce = () => {
        if (player.state !== 'started') {
            player.start();
        }
    }
    
    player.onstop = () => {
        count++;
        if (count < times) {
            playOnce();
        }
    };
    
    playOnce();
  };

   useEffect(() => {
    airRaidPlayer.current = new Tone.Player({
      url: "/Air-raid-siren.mp3",
      loop: false,
      autostart: false,
    }).toDestination();
    
    fireAlarmPlayer.current = new Tone.Player({
      url: "/fire-alarm.mp3",
      autostart: false,
      loop: false,
    }).toDestination();
    
    miningPlayer.current = new Tone.Player({
      url: "/mining.mp3",
      autostart: false,
      loop: false,
    }).toDestination();

    return () => {
        airRaidPlayer.current?.dispose();
        fireAlarmPlayer.current?.dispose();
        miningPlayer.current?.dispose();
    }
  }, []);

  useEffect(() => {
    const fireAlertDocRef = doc(db, 'emergencyAlerts', 'fireAlarm');
    const fireUnsubscribe = onSnapshot(fireAlertDocRef, (doc) => {
      if (doc.exists()) {
        setFireAlert(doc.data() as EmergencyAlert);
      }
    });

    const miningAlertDocRef = doc(db, 'emergencyAlerts', 'miningAlarm');
    const miningUnsubscribe = onSnapshot(miningAlertDocRef, (doc) => {
      if (doc.exists()) {
        setMiningAlert(doc.data() as EmergencyAlert);
      }
    });

    return () => {
      fireUnsubscribe();
      miningUnsubscribe();
    };
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

  useEffect(() => {
    if (miningAlert?.isActive) {
        // Mining alert has top priority
        airRaidPlayer.current?.stop();
        fireAlarmPlayer.current?.stop();
        playSound(miningPlayer.current, 3);
    } else if (fireAlert?.isActive) {
        // Fire alert has second priority
        airRaidPlayer.current?.stop();
        miningPlayer.current?.stop();
        playSound(fireAlarmPlayer.current, 3);
    } else if (airRaidAlert?.shouldAlert) {
        // Air raid alert has lowest priority
        miningPlayer.current?.stop();
        fireAlarmPlayer.current?.stop();
        if (lastAlertStatus === false || lastAlertStatus === null) {
            playSound(airRaidPlayer.current, 3);
        }
    } else {
        // No alerts are active, stop all sounds
        airRaidPlayer.current?.stop();
        fireAlarmPlayer.current?.stop();
        miningPlayer.current?.stop();
    }
    
    if (airRaidAlert) {
        setLastAlertStatus(airRaidAlert.shouldAlert);
    }

  }, [airRaidAlert, lastAlertStatus, fireAlert, miningAlert]);

  const activeEmergencyAlert = fireAlert?.isActive ? fireAlert : (miningAlert?.isActive ? miningAlert : null);
  const isAnyAlertActive = !!activeEmergencyAlert || (airRaidAlert?.shouldAlert ?? false);


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
        <Slideshow isAlertActive={isAnyAlertActive} activeEmergencyAlert={activeEmergencyAlert} airRaidAlert={airRaidAlert}/>
      </main>
      <footer className="absolute bottom-0 left-0 right-0 z-10 h-16">
        <NewsTicker />
      </footer>
    </div>
  );
}
