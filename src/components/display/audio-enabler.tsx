
'use client';

import { useState, useEffect } from 'react';
import * as Tone from 'tone';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AudioEnabler() {
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
      // Check initial state
      setIsAudioEnabled(Tone.context.state === 'running');
      setIsMuted(Tone.Destination.mute);
  }, []);

  const handleEnableAudio = async () => {
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }
    Tone.Destination.mute = false;
    setIsAudioEnabled(true);
    setIsMuted(false);
  };
  
  const handleToggleMute = () => {
    Tone.Destination.mute = !Tone.Destination.mute;
    setIsMuted(Tone.Destination.mute);
  }

  if (isAudioEnabled) {
    return (
        <div className="absolute bottom-20 right-4 z-[100]">
            <Button onClick={handleToggleMute} size="icon" variant="ghost" className="bg-black/20 text-white hover:bg-black/40 hover:text-white rounded-full h-12 w-12">
                {isMuted ? <VolumeX /> : <Volume2 />}
            </Button>
        </div>
    );
  }

  return (
    <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm">
      <div className="text-center">
        <Volume2 className="mx-auto h-16 w-16 mb-4" />
        <h1 className="text-3xl font-bold mb-2">Звук вимкнено</h1>
        <p className="text-muted-foreground mb-6">Натисніть кнопку, щоб увімкнути звукові сповіщення.</p>
        <Button size="lg" onClick={handleEnableAudio}>
          Увімкнути звук
        </Button>
      </div>
    </div>
  );
}
