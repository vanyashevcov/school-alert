
'use client';

import { useState } from 'react';
import * as Tone from 'tone';
import { Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AudioEnabler() {
  const [isAudioEnabled, setIsAudioEnabled] = useState(Tone.context.state === 'running');

  const handleEnableAudio = async () => {
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }
    setIsAudioEnabled(true);
  };

  if (isAudioEnabled) {
    return null;
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
