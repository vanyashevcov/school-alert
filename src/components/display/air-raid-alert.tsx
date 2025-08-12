'use client';

import { useState, useEffect } from 'react';
import * as Tone from 'tone';
import { Siren, ShieldCheck } from 'lucide-react';
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
      const poltavaOblastAlert = alerts.find(alert => alert.location_title.includes('Полтавська область'));
      if (poltavaOblastAlert) {
           return analyzeAirRaidAlert({
                city: poltavaOblastAlert.location_title,
                alertStatus: true,
                alertMessage: `Повітряна тривога в ${poltavaOblastAlert.location_title}`,
            });
      }
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
