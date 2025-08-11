'use client';

import { useState, useEffect } from 'react';
import * as Tone from 'tone';
import { Siren } from 'lucide-react';
import { useInterval } from '@/hooks/use-interval';
import { analyzeAirRaidAlert, type AirRaidAlertOutput } from '@/ai/flows/air-raid-alert-reasoning';
import { cn } from '@/lib/utils';
import { getAirRaidAlerts } from '@/lib/actions';


async function checkPoltavaAlert(): Promise<AirRaidAlertOutput> {
  try {
    const alerts = await getAirRaidAlerts();
    const poltavaAlert = alerts.find(alert => 
        alert.location_title.includes('Полтава') && 
        !alert.location_title.includes('область') && // Exclude full oblast alerts
        alert.alert_type === 'air_raid' // Check for air raid type
    );

    if (poltavaAlert) {
      // Alert is active for Poltava city
      return analyzeAirRaidAlert({
        city: poltavaAlert.location_title,
        alertStatus: true,
        alertMessage: `Повітряна тривога в ${poltavaAlert.location_title}`,
      });
    } else {
      // No active alert for Poltava city
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
  
  // Check every 60 seconds
  useInterval(checkAlerts, 60000); 

  useEffect(() => {
    if (alertState?.shouldAlert && !lastAlertStatus) {
      // Alert has just become active
      if (Tone.context.state === 'running') {
        const synth = new Tone.PolySynth(Tone.Synth).toDestination();
        synth.triggerAttackRelease(['C4', 'E4', 'G#4'], '2s');
      }
    }
    setLastAlertStatus(alertState?.shouldAlert ?? null);
  }, [alertState, lastAlertStatus]);

  if (!alertState || !alertState.shouldAlert) {
    return null;
  }

  return (
    <div
      className={cn(
        'absolute top-0 left-0 right-0 z-50 flex items-center justify-center gap-4 bg-red-600 p-4 text-white shadow-lg animate-pulse'
      )}
    >
      <Siren className="h-10 w-10" />
      <div className="text-center">
        <h2 className="text-3xl font-bold">ПОВІТРЯНА ТРИВОГА</h2>
        <p className="text-lg">{alertState.reason}</p>
      </div>
      <Siren className="h-10 w-10" />
    </div>
  );
}
