
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
import { getAirRaidAlerts } from '@/lib/actions';
import { analyzeAirRaidAlert, type AirRaidAlertOutput } from '@/ai/flows/air-raid-alert-reasoning';


async function checkPoltavaAlert(): Promise<AirRaidAlertOutput> {
  try {
    const alerts = await getAirRaidAlerts();
    const poltavaCityAlert = alerts.find(alert => 
        alert.location_title === 'м. Полтава' &&
        alert.alert_type === 'air_raid'
    );
    const poltavaOblastAlert = alerts.find(alert => alert.location_title === 'Полтавська область');

    if (poltavaCityAlert) {
      return analyzeAirRaidAlert({
        city: poltavaCityAlert.location_title,
        alertStatus: true,
        alertMessage: `Повітряна тривога в ${poltavaCityAlert.location_title}`,
      });
    } else if (poltavaOblastAlert) {
        return analyzeAirRaidAlert({
            city: poltavaOblastAlert.location_title,
            alertStatus: true,
            alertMessage: `Повітряна тривога в ${poltavaOblastAlert.location_title}`,
        });
    } else {
      return { shouldAlert: false, reason: 'Відбій тривоги або відсутність загрози для Полтави.' };
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
  const sirenPlayer = useRef<Tone.Player | null>(null);

   useEffect(() => {
    sirenPlayer.current = new Tone.Player({
        url: "https://www.myinstants.com/media/sounds/air-raid-siren.mp3",
        autostart: false,
        loop: true,
    }).toDestination();
    
    return () => {
        sirenPlayer.current?.dispose();
    }
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
  
  useInterval(checkAlerts, 30000); 

  useEffect(() => {
    const playSound = async () => {
      if (Tone.context.state !== 'running' || !sirenPlayer.current) return;
      if (sirenPlayer.current.loaded) {
          sirenPlayer.current.start();
      }
    }

    if (alertState?.shouldAlert) {
      if (!lastAlertStatus) { // Alert just became active
          playSound();
      }
    } else {
        sirenPlayer.current?.stop();
    }

    setLastAlertStatus(alertState?.shouldAlert ?? null);
  }, [alertState, lastAlertStatus]);

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
        <Slideshow isAlertActive={alertState?.shouldAlert ?? false} />
      </main>
      <footer className="absolute bottom-0 left-0 right-0 z-10 h-16">
        <NewsTicker />
      </footer>
    </div>
  );
}
