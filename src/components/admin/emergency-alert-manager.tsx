
'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { EmergencyAlert } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Flame, Loader2 } from 'lucide-react';

export default function EmergencyAlertManager() {
  const [alertState, setAlertState] = useState<EmergencyAlert | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const fireAlertDocRef = doc(db, 'emergencyAlerts', 'fireAlarm');

  useEffect(() => {
    const unsubscribe = onSnapshot(fireAlertDocRef, (doc) => {
        if (doc.exists()) {
            const data = doc.data() as EmergencyAlert;
            setAlertState(data);
            setMessage(data.message);
        } else {
            // If the document doesn't exist, create it with default values
            const defaultState: EmergencyAlert = {
                id: 'fireAlarm',
                isActive: false,
                message: 'Увага! Пожежна тривога! Негайно покиньте приміщення, слідуючи плану евакуації.'
            };
            setDoc(fireAlertDocRef, defaultState);
            setAlertState(defaultState);
            setMessage(defaultState.message);
        }
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleToggleActive = async (isActive: boolean) => {
    if (!alertState) return;
    try {
      await updateDoc(fireAlertDocRef, { isActive });
      setAlertState(prev => prev ? { ...prev, isActive } : null);
      toast({ title: `Пожежну тривогу ${isActive ? 'активовано' : 'деактивовано'}!` });
    } catch (error) {
      console.error("Error toggling fire alarm: ", error);
      toast({ variant: 'destructive', title: 'Помилка', description: 'Не вдалося змінити стан тривоги.' });
    }
  };

  const handleSaveMessage = async () => {
    if (!alertState || !message.trim()) return;
    setIsSaving(true);
    try {
      await updateDoc(fireAlertDocRef, { message });
      toast({ title: 'Повідомлення оновлено!' });
    } catch (error) {
      console.error("Error saving message: ", error);
      toast({ variant: 'destructive', title: 'Помилка', description: 'Не вдалося зберегти повідомлення.' });
    } finally {
        setIsSaving(false);
    }
  };

  if (isLoading) {
      return (
          <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
      )
  }

  return (
    <div className="p-8">
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Flame className="h-8 w-8 text-destructive" />
                    <div>
                        <CardTitle>Пожежна тривога</CardTitle>
                        <CardDescription>Керування сигналом пожежної тривоги та евакуації.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <h3 className="text-lg font-medium">Активувати тривогу</h3>
                        <p className="text-sm text-muted-foreground">
                           {alertState?.isActive ? "Тривога активна. На головному екрані відображається сповіщення." : "Тривога неактивна."}
                        </p>
                    </div>
                    <Switch
                        checked={alertState?.isActive || false}
                        onCheckedChange={handleToggleActive}
                        aria-readonly
                    />
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="evacuationMessage">Текст евакуаційного повідомлення</Label>
                    <Textarea 
                        id="evacuationMessage"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Введіть текст, який буде відображатися під час тривоги..."
                        rows={4}
                    />
                </div>
                
                <div className="flex justify-end">
                    <Button onClick={handleSaveMessage} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Зберегти повідомлення
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
