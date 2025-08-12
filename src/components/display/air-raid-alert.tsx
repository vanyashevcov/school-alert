
'use client';

import { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { Siren, ShieldCheck } from 'lucide-react';
import { useInterval } from '@/hooks/use-interval';
import { analyzeAirRaidAlert, type AirRaidAlertOutput } from '@/ai/flows/air-raid-alert-reasoning';
import { cn } from '@/lib/utils';
import { getAirRaidAlerts } from '@/lib/actions';


async function checkPoltavaAlert(): Promise<AirRaidAlertOutput> {
  try {
    const alerts = await getAirRaidAlerts();
    // Prioritize city alert over region alert
    const poltavaCityAlert = alerts.find(alert => 
        alert.location_title === 'м. Полтава' &&
        alert.alert_type === 'air_raid'
    );
     const poltavaOblastAlert = alerts.find(alert => alert.location_title === 'Полтавська область');

    if (poltavaCityAlert) {
      // Alert is active for Poltava city
      return analyzeAirRaidAlert({
        city: poltavaCityAlert.location_title,
        alertStatus: true,
        alertMessage: `Повітряна тривога в ${poltavaCityAlert.location_title}`,
      });
    } else if (poltavaOblastAlert) {
        // Alert is active for Poltava region
        return analyzeAirRaidAlert({
            city: poltavaOblastAlert.location_title,
            alertStatus: true,
            alertMessage: `Повітряна тривога в ${poltavaOblastAlert.location_title}`,
        });
    } else {
      // No active alert for Poltava city or region
      return { shouldAlert: false, reason: 'Відбій тривоги або відсутність загрози для Полтави.' };
    }
  } catch (error) {
    console.error('Error fetching air raid status:', error);
    // In case of error, assume no alert to avoid false positives
    return { shouldAlert: false, reason: 'Помилка отримання даних.' };
  }
}

export default function AirRaidAlert() {
  const [alertState, setAlertState] = useState<AirRaidAlertOutput | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastAlertStatus, setLastAlertStatus] = useState<boolean | null>(null);
  const sirenPlayer = useRef<Tone.Player | null>(null);

   useEffect(() => {
    // Initialize the player only on the client side
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
    // Initial check
    checkAlerts();
  }, []);
  
  // Check every 30 seconds
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

  if (!alertState) {
    return null; // Don't render anything until check is complete
  }

  return (
    <div
      className={cn(
        'p-4 rounded-lg flex items-center gap-3 transition-all duration-500',
        alertState.shouldAlert
          ? 'bg-red-600/90 text-white animate-pulse'
          : 'bg-black/20 text-white'
      )}
    >
      {alertState.shouldAlert ? (
        <Siren className="h-8 w-8" />
      ) : (
        <ShieldCheck className="h-8 w-8 text-green-400" />
      )}
      <div className="text-right">
        <h2 className="text-xl font-bold">
            {alertState.shouldAlert ? 'Повітряна тривога' : 'Безпечно'}
        </h2>
        <p className="text-sm opacity-90">
            {alertState.shouldAlert ? alertState.reason : 'м. Полтава'}
        </p>
      </div>
    </div>
  );
}
