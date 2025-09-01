
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
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { EmergencyAlert, VideoSettings } from '@/lib/types';
import BellNotification from '@/components/display/bell-notification';
import MorningVideoPlayer from '@/components/display/morning-video-player';
import { format } from 'date-fns';

export interface AirRaidAlertOutput {
  shouldAlert: boolean;
  reason: string;
}

export default function Home() {
  const [airRaidAlert, setAirRaidAlert] = useState<AirRaidAlertOutput | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [fireAlert, setFireAlert] = useState<EmergencyAlert | null>(null);
  const [miningAlert, setMiningAlert] = useState<EmergencyAlert | null>(null);
  const [bellNotification, setBellNotification] = useState<string | null>(null);
  const [videoSettings, setVideoSettings] = useState<VideoSettings | null>(null);
  const [hasPlayedToday, setHasPlayedToday] = useState(false);
  const prevAirRaidStatus = useRef<boolean | null>(null);
  const initialAlertCheckDone = useRef(false);

  const fireAlarmPlayer = useRef<Tone.Player | null>(null);
  const airRaidPlayer = useRef<Tone.Player | null>(null);
  const miningPlayer = useRef<Tone.Player | null>(null);
  const allClearPlayer = useRef<Tone.Player | null>(null);
  const [areSoundsLoaded, setAreSoundsLoaded] = useState(false);

  const playCounter = useRef<{ [key: string]: number }>({}).current;
  const MAX_PLAYS = 3;

   const playSoundRepeatedly = (player: Tone.Player | null, alertId: string) => {
      if (!player || !player.loaded || player.state === 'started' || !areSoundsLoaded) return;

      playCounter[alertId] = 0;
      const playerNode = player; // Capture player in this scope

      const playOnce = () => {
          if (playCounter[alertId] < MAX_PLAYS) {
              playerNode.start();
              playCounter[alertId]++;
          }
      };

      playerNode.onstop = () => {
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

    const loadSounds = async () => {
        try {
            const airRaidBuffer = await new Tone.Buffer(`${baseUrl}/Air-raid-siren.mp3`);
            airRaidPlayer.current = new Tone.Player(airRaidBuffer).toDestination();
            
            const fireAlarmBuffer = await new Tone.Buffer(`${baseUrl}/fire-alarm.mp3`);
            fireAlarmPlayer.current = new Tone.Player(fireAlarmBuffer).toDestination();

            const miningBuffer = await new Tone.Buffer(`${baseUrl}/mining.mp3`);
            miningPlayer.current = new Tone.Player(miningBuffer).toDestination();

            const allClearBuffer = await new Tone.Buffer(`${baseUrl}/after-air-alert.mp3`);
            allClearPlayer.current = new Tone.Player(allClearBuffer).toDestination();
            
            await Tone.loaded();
            setAreSoundsLoaded(true);
            console.log("All audio files pre-loaded into buffers.");
        } catch(err) {
             console.error("Error loading audio files into buffers", err);
        }
    }

    loadSounds();

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

    const videoSettingsDocRef = doc(db, 'settings', 'morningVideo');
    const videoUnsubscribe = onSnapshot(videoSettingsDocRef, (doc) => {
        const data = doc.data() as VideoSettings | undefined;
        setVideoSettings(data || null);
    });

    // Check localStorage for video play status on initial load
    const lastPlayedDate = localStorage.getItem('morningVideoLastPlayed');
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    if (lastPlayedDate === todayStr) {
        setHasPlayedToday(true);
    } else {
        // If it's a new day, remove the old flag
        localStorage.removeItem('morningVideoLastPlayed');
        setHasPlayedToday(false);
    }

    return () => {
      fireUnsubscribe();
      miningUnsubscribe();
      videoUnsubscribe();
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
      if (!initialAlertCheckDone.current) {
        initialAlertCheckDone.current = true;
      }
    }
  };

  useEffect(() => {
    checkAlerts();
  }, []);

  useInterval(checkAlerts, 60000);

 useEffect(() => {
    const canPlay = Tone.context.state === 'running';
    if (!canPlay || !areSoundsLoaded) return;

    const isEmergencyActive = fireAlert?.isActive || miningAlert?.isActive;
    
    // Stop air raid if it shouldn't be alerting OR if an emergency alert is active
    if (!airRaidAlert?.shouldAlert || isEmergencyActive) {
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

  }, [airRaidAlert?.shouldAlert, fireAlert, miningAlert, areSoundsLoaded]);

  // This separate effect handles the *start* of an air raid alert.
  useEffect(() => {
    const isEmergencyActive = fireAlert?.isActive || miningAlert?.isActive;

    if (airRaidAlert?.shouldAlert && !isEmergencyActive) {
      // Case 1: The page loads and the alert is already active.
      // `prevAirRaidStatus.current` is null initially.
      const isInitialLoadWithAlert = prevAirRaidStatus.current === null && initialAlertCheckDone.current;
      
      // Case 2: The alert starts while the user is on the page.
      const justStarted = prevAirRaidStatus.current === false;

      if (isInitialLoadWithAlert || justStarted) {
        playSoundRepeatedly(airRaidPlayer.current, 'airRaid');
      }
    }
    
    // Update previous status only after the first check is complete
    if (initialAlertCheckDone.current) {
      prevAirRaidStatus.current = airRaidAlert?.shouldAlert ?? null;
    }

  }, [airRaidAlert?.shouldAlert, fireAlert?.isActive, miningAlert?.isActive, areSoundsLoaded, initialAlertCheckDone.current]);


  // Scheduled Video Logic
  useInterval(() => {
    // Don't do anything if settings aren't loaded yet
    if (!videoSettings) return;

    const now = new Date();
    const currentTime = format(now, 'HH:mm');
    const todayStr = format(now, 'yyyy-MM-dd');
    
    // Reset daily play status at midnight
    if (currentTime === '00:00' && hasPlayedToday) {
        setHasPlayedToday(false);
        localStorage.removeItem('morningVideoLastPlayed');
        return; // exit to avoid check on the same tick
    }
    
    // Check if it's time to play
    if (
      videoSettings.isScheduled &&
      videoSettings.scheduledTime === currentTime &&
      !hasPlayedToday &&
      !videoSettings.isActive
    ) {
      const videoSettingsDocRef = doc(db, 'settings', 'morningVideo');
      setDoc(videoSettingsDocRef, { isActive: true }, { merge: true });

      localStorage.setItem('morningVideoLastPlayed', todayStr);
      setHasPlayedToday(true);
    }
  }, 1000); // Check every second for precision


  const activeEmergencyAlert = fireAlert?.isActive ? fireAlert : (miningAlert?.isActive ? miningAlert : null);
  const isAnyAlertActive = !!activeEmergencyAlert || (airRaidAlert?.shouldAlert ?? false);

  const handleBellNotification = (message: string) => {
    setBellNotification(message);
    setTimeout(() => setBellNotification(null), 15000); // Hide after 15 seconds
  };


  return (
    <div className="relative flex h-full w-full flex-col">
      <AudioEnabler />
      <BellSystem onBellRing={handleBellNotification} />
      <BellNotification message={bellNotification} />
      {videoSettings?.isActive && <MorningVideoPlayer />}


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

    