
'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { VideoSettings } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Loader2, Clapperboard } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function VideoManager() {
  const [settings, setSettings] = useState<VideoSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const videoSettingsDocRef = doc(db, 'settings', 'morningVideo');

  useEffect(() => {
    const unsubscribe = onSnapshot(videoSettingsDocRef, (doc) => {
        if (doc.exists()) {
            const data = doc.data() as VideoSettings;
            setSettings(data);
        } else {
            // If the document doesn't exist, create it with default values
            const defaultState: VideoSettings = { isActive: false };
            setDoc(videoSettingsDocRef, defaultState);
            setSettings(defaultState);
        }
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleToggleActive = async (isActive: boolean) => {
    if (settings === null) return;
    try {
      await setDoc(videoSettingsDocRef, { isActive }, { merge: true });
      setSettings(prev => prev ? { ...prev, isActive } : { isActive });
      toast({ title: `Ранкове відео ${isActive ? 'увімкнено' : 'вимкнено'}.` });
    } catch (error) {
      console.error(`Error toggling video settings: `, error);
      toast({ variant: 'destructive', title: 'Помилка', description: 'Не вдалося змінити налаштування відео.' });
    }
  };


  if (isLoading) {
      return (
        <div className="p-8">
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        </div>
      )
  }
  
  return (
    <div className="p-8">
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Clapperboard className="h-8 w-8 text-primary" />
                    <div>
                        <CardTitle>Керування ранковим відео</CardTitle>
                        <CardDescription>Примусово увімкніть або вимкніть відтворення відео на головному екрані.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <h3 className="text-lg font-medium">Показати відео</h3>
                        <p className="text-sm text-muted-foreground">
                        {settings?.isActive ? "Відео зараз відображається на головному екрані." : "Відео вимкнено."}
                        </p>
                    </div>
                    <Switch
                        checked={settings?.isActive || false}
                        onCheckedChange={handleToggleActive}
                        aria-readonly
                    />
                </div>
                 <div className="text-sm text-muted-foreground pt-4">
                    <p><strong>Примітка:</strong> Відео програється один раз і автоматично вимкнеться після завершення. Ви можете увімкнути його знову в будь-який час.</p>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
