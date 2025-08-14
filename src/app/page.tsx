
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
  const [miningAlert, setMiningAlert] = useState<EmergencyAlert | null>(null);
  
  const fireAlarmPlayer = useRef<Tone.Player | null>(null);
  const airRaidPlayer = useRef<Tone.Player | null>(null);
  const miningPlayer = useRef<Tone.Player | null>(null);
  const allClearPlayer = useRef<Tone.Player | null>(null);

  const playCounter = useRef<{ [key: string]: number }>({}).current;
  const MAX_PLAYS = 3;

  const playSoundRepeatedly = (player: Tone.Player | null, alertId: string) => {
      if (!player || !player.loaded || player.state === 'started') return;
      
      playCounter[alertId] = 0;

      const playOnce = () => {
          if (playCounter[alertId] < MAX_PLAYS) {
              player.start();
              playCounter[alertId]++;
          }
      };

      player.onstop = () => {
          // Add a small delay before the next play to avoid overlapping sounds
          setTimeout(() => {
              if (playCounter[alertId] < MAX_PLAYS) {
                  playOnce();
              }
          }, 500);
      };
      
      playOnce();
  };

  const stopSound = (player: Tone.Player | null, alertId: string) => {
      if (player?.state === 'started') {
          player.stop();
      }
      playCounter[alertId] = MAX_PLAYS; // Prevent further plays
      if (player) {
        player.onstop = () => {}; // Clean up the handler safely
      }
  };


   useEffect(() => {
    // Using absolute URLs to ensure files are found
    const baseUrl = window.location.origin;
    
    airRaidPlayer.current = new Tone.Player({ url: `${baseUrl}/Air-raid-siren.mp3`}).toDestination();
    fireAlarmPlayer.current = new Tone.Player({ url: `${baseUrl}/fire-alarm.mp3`}).toDestination();
    miningPlayer.current = new Tone.Player({ url: `${baseUrl}/mining.mp3`}).toDestination();
    allClearPlayer.current = new Tone.Player({ url: `${baseUrl}/after-air-alert.mp3`}).toDestination();
    
    // Pre-load all players
    Promise.all([
        airRaidPlayer.current.load(`${baseUrl}/Air-raid-siren.mp3`),
        fireAlarmPlayer.current.load(`${baseUrl}/fire-alarm.mp3`),
        miningPlayer.current.load(`${baseUrl}/mining.mp3`),
        allClearPlayer.current.load(`${baseUrl}/after-air-alert.mp3`),
    ]).then(() => {
        console.log("All audio files loaded.");
    }).catch(err => {
        console.error("Error loading audio files", err);
    });

    return () => {
        airRaidPlayer.current?.dispose();
        fireAlarmPlayer.current?.dispose();
        miningPlayer.current?.dispose();
        allClearPlayer.current?.dispose();
    }
  }, []);

  useEffect(() => {
    const fireAlertDocRef = doc(db, 'emergencyAlerts', 'fireAlarm');
    const fireUnsubscribe = onSnapshot(fireAlertDocRef, (doc) => {
      const data = doc.data() as EmergencyAlert | undefined;
      setFireAlert(data || null);
    });

    const miningAlertDocRef = doc(db, 'emergencyAlerts', 'miningAlarm');
    const miningUnsubscribe = onSnapshot(miningAlertDocRef, (doc) => {
      const data = doc.data() as EmergencyAlert | undefined;
      setMiningAlert(data || null);
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

      setAirRaidAlert((prevAlert) => {
        const newReason = status === 'A' ? 'Тривога у м. Полтава' : 'Часткова тривога';
        
        // Check if the alert status has just changed to "off"
        if (prevAlert?.shouldAlert === true && shouldAlert === false) {
           if (allClearPlayer.current?.loaded) {
                allClearPlayer.current.start();
           }
        }
        
        return { shouldAlert, reason: shouldAlert ? newReason : 'Відбій тривоги' };
      });
      
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
    const canPlay = Tone.context.state === 'running';
    if (!canPlay) return;

    // Air Raid Alert
    if (airRaidAlert?.shouldAlert) {
      playSoundRepeatedly(airRaidPlayer.current, 'airRaid');
    } else {
      stopSound(airRaidPlayer.current, 'airRaid');
    }

    // Fire Alarm
    if (fireAlert?.isActive) {
      playSoundRepeatedly(fireAlarmPlayer.current, 'fire');
    } else {
      stopSound(fireAlarmPlayer.current, 'fire');
    }

    // Mining Alarm
    if (miningAlert?.isActive) {
      playSoundRepeatedly(miningPlayer.current, 'mining');
    } else {
      stopSound(miningPlayer.current, 'mining');
    }

  }, [airRaidAlert, fireAlert, miningAlert]);


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

