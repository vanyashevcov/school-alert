
'use client';

import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { EmergencyAlert, EmergencyAlertId } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Flame, Loader2, Triangle, Bomb } from 'lucide-react';
import { cn } from '@/lib/utils';


const alertConfig: Record<EmergencyAlertId, {
    title: string;
    description: string;
    icon: React.FC<any>;
    defaultMessage: string;
}> = {
    fireAlarm: {
        title: "Пожежна тривога",
        description: "Керування сигналом пожежної тривоги та евакуації.",
        icon: Flame,
        defaultMessage: 'Увага! Пожежна тривога! Негайно покиньте приміщення, слідуючи плану евакуації.'
    },
    miningAlarm: {
        title: "Тривога замінування",
        description: "Керування сигналом при загрозі замінування.",
        icon: Bomb,
        defaultMessage: 'Увага! Загроза мінування! Зберігайте спокій та слідуйте інструкціям.'
    }
}


function AlertCard({ alertId, config }: { alertId: EmergencyAlertId, config: typeof alertConfig[EmergencyAlertId] }) {
  const [alertState, setAlertState] = useState<EmergencyAlert | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  const alertDocRef = doc(db, 'emergencyAlerts', alertId);

  useEffect(() => {
    const unsubscribe = onSnapshot(alertDocRef, (doc) => {
        if (doc.exists()) {
            const data = doc.data() as EmergencyAlert;
            setAlertState(data);
            setMessage(data.message);
        } else {
            // If the document doesn't exist, create it with default values
            const defaultState: EmergencyAlert = {
                id: alertId,
                isActive: false,
                message: config.defaultMessage
            };
            setDoc(alertDocRef, defaultState);
            setAlertState(defaultState);
            setMessage(defaultState.message);
        }
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, [alertId, config.defaultMessage]);

  const handleToggleActive = async (isActive: boolean) => {
    if (!alertState) return;
    try {
      await updateDoc(alertDocRef, { isActive });
      setAlertState(prev => prev ? { ...prev, isActive } : null);
      toast({ title: `${config.title} ${isActive ? 'активовано' : 'деактивовано'}!` });
    } catch (error) {
      console.error(`Error toggling ${alertId}: `, error);
      toast({ variant: 'destructive', title: 'Помилка', description: 'Не вдалося змінити стан тривоги.' });
    }
  };

  const handleSaveMessage = async () => {
    if (!alertState || !message.trim()) return;
    setIsSaving(true);
    try {
      await updateDoc(alertDocRef, { message });
      toast({ title: 'Повідомлення оновлено!' });
    } catch (error) {
      console.error(`Error saving ${alertId} message: `, error);
      toast({ variant: 'destructive', title: 'Помилка', description: 'Не вдалося зберегти повідомлення.' });
    } finally {
        setIsSaving(false);
    }
  };

  if (isLoading) {
      return (
          <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <div>
                        <CardTitle>{config.title}</CardTitle>
                        <CardDescription>Завантаження...</CardDescription>
                    </div>
                </div>
            </CardHeader>
          </Card>
      )
  }
  
  const Icon = config.icon;

  return (
    <Card>
        <CardHeader>
            <div className="flex items-center gap-4">
                <Icon className={cn("h-8 w-8", alertId === 'fireAlarm' ? 'text-destructive' : 'text-amber-500')} />
                <div>
                    <CardTitle>{config.title}</CardTitle>
                    <CardDescription>{config.description}</CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5 pr-4">
                    <h3 className="text-base md:text-lg font-medium">Активувати тривогу</h3>
                    <p className="text-sm text-muted-foreground">
                       {alertState?.isActive ? "Тривога активна." : "Тривога неактивна."}
                    </p>
                </div>
                <Switch
                    checked={alertState?.isActive || false}
                    onCheckedChange={handleToggleActive}
                    aria-readonly
                />
            </div>
            
            <div className="space-y-2">
                <Label htmlFor={`message-${alertId}`}>Текст евакуаційного повідомлення</Label>
                <Textarea 
                    id={`message-${alertId}`}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Введіть текст, який буде відображатися під час тривоги..."
                    rows={4}
                />
            </div>
            
            <div className="flex justify-end">
                <Button onClick={handleSaveMessage} disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Зберегти
                </Button>
            </div>
        </CardContent>
    </Card>
  )
}

export default function EmergencyAlertManager() {
  return (
    <div className="space-y-8">
        <AlertCard alertId="fireAlarm" config={alertConfig.fireAlarm} />
        <AlertCard alertId="miningAlarm" config={alertConfig.miningAlarm} />
    </div>
  );
}
