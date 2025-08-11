'use client';

import { useState, useEffect } from 'react';
import * as Tone from 'tone';
import { Siren } from 'lucide-react';
import { useInterval } from '@/hooks/use-interval';
import { analyzeAirRaidAlert, type AirRaidAlertInput, type AirRaidAlertOutput } from '@/ai/flows/air-raid-alert-reasoning';
import { cn } from '@/lib/utils';

// Mock API response cycle
const mockAlerts = [
  { city: 'Kyiv', alertStatus: true, alertMessage: 'Threat of ballistic missiles' },
  { city: 'Poltava', alertStatus: true, alertMessage: 'UAV attack' },
  { city: 'Poltava', alertStatus: false, alertMessage: 'All clear' },
  { city: 'Lviv', alertStatus: true, alertMessage: 'Airborne threat' },
];

let mockIndex = 0;

async function fetchAirRaidStatus(): Promise<AirRaidAlertInput> {
  // This is a mock. In a real app, you would fetch from alerts.in.ua
  const alert = mockAlerts[mockIndex];
  mockIndex = (mockIndex + 1) % mockAlerts.length;
  return alert;
}

export default function AirRaidAlert() {
  const [alertState, setAlertState] = useState<AirRaidAlertOutput | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastAlertStatus, setLastAlertStatus] = useState<boolean | null>(null);

  const checkAlerts = async () => {
    if (isChecking) return;
    setIsChecking(true);
    try {
      const alertData = await fetchAirRaidStatus();
      const analysis = await analyzeAirRaidAlert(alertData);
      setAlertState(analysis);
    } catch (error) {
      console.error('Error analyzing air raid alert:', error);
      setAlertState({ shouldAlert: false, reason: 'Error fetching data.' });
    } finally {
      setIsChecking(false);
    }
  };
  
  useEffect(() => {
    // Initial check
    checkAlerts();
  }, []);
  
  useInterval(checkAlerts, 30000); // Poll every 30 seconds

  useEffect(() => {
    if (alertState && alertState.shouldAlert && !lastAlertStatus) {
      // Alert has just become active
      Tone.start();
      const synth = new Tone.PolySynth(Tone.Synth).toDestination();
      synth.triggerAttackRelease(['C4', 'E4', 'G#4'], '2s');
    }
    if (alertState) {
        setLastAlertStatus(alertState.shouldAlert);
    }
  }, [alertState]);

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
