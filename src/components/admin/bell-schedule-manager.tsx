
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { BellTime, DayOfWeek } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const daysOfWeek: { value: DayOfWeek, label: string }[] = [
    { value: 'monday', label: 'Понеділок' },
    { value: 'tuesday', label: 'Вівторок' },
    { value: 'wednesday', label: 'Середа' },
    { value: 'thursday', label: 'Четвер' },
    { value: 'friday', label: 'П\'ятниця' },
];

function ScheduleForm({ onSave, onCancel, bellTime, day }: { onSave: (data: Omit<BellTime, 'id'>) => void, onCancel: () => void, bellTime: BellTime | null, day: DayOfWeek }) {
    const [time, setTime] = useState(bellTime?.time || '08:00');
    const [label, setLabel] = useState(bellTime?.label || '');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ time, label, day });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="time">Час</Label>
                <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
            </div>
             <div className="space-y-2">
                <Label htmlFor="label">Призначення</Label>
                <Input id="label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Наприклад, 'Початок уроку'" required />
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel}>Скасувати</Button>
                <Button type="submit">Зберегти</Button>
            </div>
        </form>
    )
}

function DailySchedule({ day, label }: { day: DayOfWeek, label: string }) {
  const [schedule, setSchedule] = useState<BellTime[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTime, setEditingTime] = useState<BellTime | null>(null);
  const { toast } = useToast();
  const scheduleCollectionRef = collection(db, 'bellSchedule');

  useEffect(() => {
    const q = query(scheduleCollectionRef, where('day', '==', day), orderBy('time', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const scheduleData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as BellTime[];
        setSchedule(scheduleData);
    });
    return () => unsubscribe();
  }, [day]);

   const handleSave = async (bellTimeData: Omit<BellTime, 'id'>) => {
    try {
        if (editingTime) {
            const timeDoc = doc(db, 'bellSchedule', editingTime.id);
            await updateDoc(timeDoc, bellTimeData);
            toast({ title: 'Час оновлено!'});
        } else {
            await addDoc(scheduleCollectionRef, bellTimeData);
            toast({ title: 'Час додано!'});
        }
        setEditingTime(null);
        setIsFormOpen(false);
    } catch (error) {
        console.error("Error saving time: ", error);
        toast({ variant: 'destructive', title: 'Помилка', description: 'Не вдалося зберегти час.'});
    }
  };

  const handleEdit = (bellTime: BellTime) => {
    setEditingTime(bellTime);
    setIsFormOpen(true);
  };
  
  const handleDelete = async (id: string) => {
    if (!window.confirm("Ви впевнені, що хочете видалити цей час?")) return;
    try {
        const timeDoc = doc(db, 'bellSchedule', id);
        await deleteDoc(timeDoc);
        toast({ title: 'Час видалено.'});
    } catch (error) {
        console.error("Error deleting time: ", error);
        toast({ variant: 'destructive', title: 'Помилка', description: 'Не вдалося видалити час.'});
    }
  }

  return (
    <>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">{label}</h3>
             <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
                setIsFormOpen(isOpen);
                if (!isOpen) setEditingTime(null);
             }}>
                <DialogTrigger asChild>
                    <Button onClick={() => setEditingTime(null)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Додати час
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingTime ? 'Редагувати' : 'Додати'} час для: {label}</DialogTitle>
                    </DialogHeader>
                    <ScheduleForm
                        bellTime={editingTime}
                        day={day}
                        onSave={handleSave}
                        onCancel={() => {
                            setEditingTime(null);
                            setIsFormOpen(false);
                        }}
                    />
                </DialogContent>
            </Dialog>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Час</TableHead>
              <TableHead>Призначення</TableHead>
              <TableHead className="text-right">Дії</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedule.length > 0 ? schedule.map(item => (
              <TableRow key={item.id}>
                <TableCell className="font-mono">{item.time}</TableCell>
                <TableCell>{item.label}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>Редагувати</Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>Видалити</Button>
                </TableCell>
              </TableRow>
            )) : (
                <TableRow>
                    <TableCell colSpan={3} className="text-center h-24">Розклад для цього дня порожній.</TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
    </>
  )
}

export default function BellScheduleManager() {
  const [activeTab, setActiveTab] = useState<DayOfWeek>('monday');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Розклад дзвінків</CardTitle>
        <CardDescription>Керуйте часом початку та кінця уроків для кожного дня тижня.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DayOfWeek)} className="space-y-4">
            <TabsList>
                {daysOfWeek.map(({ value, label }) => (
                    <TabsTrigger key={value} value={value}>{label}</TabsTrigger>
                ))}
            </TabsList>
            {daysOfWeek.map(({ value, label }) => (
                <TabsContent key={value} value={value} className="space-y-4">
                    <DailySchedule day={value} label={label} />
                </TabsContent>
            ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
