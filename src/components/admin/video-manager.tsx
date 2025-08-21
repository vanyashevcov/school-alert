
'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { VideoSettings } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Loader2, Clapperboard, CalendarClock } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

export default function VideoManager() {
  const [settings, setSettings] = useState<VideoSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const videoSettingsDocRef = doc(db, 'settings', 'morningVideo');

  useEffect(() => {
    const unsubscribe = onSnapshot(videoSettingsDocRef, (doc) => {
        if (doc.exists()) {
            const data = doc.data() as VideoSettings;
            setSettings(data);
        } else {
            const defaultState: VideoSettings = { 
                isActive: false, 
                isScheduled: false, 
                scheduledTime: '09:00' 
            };
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
      await updateDoc(videoSettingsDocRef, { isActive });
      toast({ title: `Ранкове відео ${isActive ? 'увімкнено' : 'вимкнено'}.` });
    } catch (error) {
      console.error(`Error toggling video settings: `, error);
      toast({ variant: 'destructive', title: 'Помилка', description: 'Не вдалося змінити налаштування відео.' });
    }
  };

  const handleScheduleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (settings === null) return;
    setIsSaving(true);
    try {
        await updateDoc(videoSettingsDocRef, {
            isScheduled: settings.isScheduled,
            scheduledTime: settings.scheduledTime,
        });
        toast({ title: 'Налаштування розкладу збережено!' });
    } catch (error) {
        console.error('Error saving schedule: ', error);
        toast({ variant: 'destructive', title: 'Помилка', description: 'Не вдалося зберегти розклад.' });
    } finally {
        setIsSaving(false);
    }
  };
  
  const handleScheduleChange = (key: keyof VideoSettings, value: any) => {
    setSettings(prev => prev ? {...prev, [key]: value} : null);
  }

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
    <div className="p-8 space-y-8">
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Clapperboard className="h-8 w-8 text-primary" />
                    <div>
                        <CardTitle>Ручне керування</CardTitle>
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

         <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <CalendarClock className="h-8 w-8 text-primary" />
                    <div>
                        <CardTitle>Автоматичне відтворення</CardTitle>
                        <CardDescription>Налаштуйте час для автоматичного щоденного показу відео.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleScheduleSave} className="space-y-6">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <h3 className="text-lg font-medium">Увімкнути розклад</h3>
                            <p className="text-sm text-muted-foreground">
                            {settings?.isScheduled ? "Відео буде вмикатися автоматично." : "Автоматичне відтворення вимкнено."}
                            </p>
                        </div>
                        <Switch
                            checked={settings?.isScheduled || false}
                            onCheckedChange={(checked) => handleScheduleChange('isScheduled', checked)}
                        />
                    </div>

                    {settings?.isScheduled && (
                        <div className="space-y-2">
                            <Label htmlFor="scheduleTime">Час відтворення</Label>
                            <Input
                                id="scheduleTime"
                                type="time"
                                value={settings?.scheduledTime || '09:00'}
                                onChange={(e) => handleScheduleChange('scheduledTime', e.target.value)}
                                className="w-48"
                            />
                        </div>
                    )}
                    
                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Зберегти розклад
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    </div>
  );
}
