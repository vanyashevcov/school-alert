
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { LessonTime, DayOfWeek } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const daysOfWeek: { value: DayOfWeek, label: string }[] = [
    { value: 'monday', label: 'Понеділок' },
    { value: 'tuesday', label: 'Вівторок' },
    { value: 'wednesday', label: 'Середа' },
    { value: 'thursday', label: 'Четвер' },
    { value: 'friday', label: 'П\'ятниця' },
];

function ScheduleForm({ onSave, onCancel, lessonTime, day }: { onSave: (data: Omit<LessonTime, 'id'>) => void, onCancel: () => void, lessonTime: LessonTime | null, day: DayOfWeek }) {
    const [lessonNumber, setLessonNumber] = useState(lessonTime?.lessonNumber || '1');
    const [startTime, setStartTime] = useState(lessonTime?.startTime || '08:00');
    const [endTime, setEndTime] = useState(lessonTime?.endTime || '08:45');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ lessonNumber, startTime, endTime, day });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="lessonNumber">Номер уроку</Label>
                <Input id="lessonNumber" value={lessonNumber} onChange={(e) => setLessonNumber(e.target.value)} placeholder="Наприклад, '1' або 'Перерва'" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="startTime">Час початку</Label>
                    <Input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="endTime">Час закінчення</Label>
                    <Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel}>Скасувати</Button>
                <Button type="submit">Зберегти</Button>
            </div>
        </form>
    )
}

function DailySchedule({ day, label }: { day: DayOfWeek, label: string }) {
  const [schedule, setSchedule] = useState<LessonTime[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTime, setEditingTime] = useState<LessonTime | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    const scheduleCollectionRef = collection(db, 'lessonSchedule');
    const q = query(scheduleCollectionRef, where('day', '==', day));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const scheduleData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as LessonTime[];
        scheduleData.sort((a, b) => a.startTime.localeCompare(b.startTime));
        setSchedule(scheduleData);
    });
    return () => unsubscribe();
  }, [day]);

   const handleSave = async (lessonTimeData: Omit<LessonTime, 'id'>) => {
    try {
        const scheduleCollectionRef = collection(db, 'lessonSchedule');
        if (editingTime) {
            const timeDoc = doc(db, 'lessonSchedule', editingTime.id);
            await updateDoc(timeDoc, lessonTimeData);
            toast({ title: 'Час оновлено!'});
        } else {
            await addDoc(scheduleCollectionRef, lessonTimeData);
            toast({ title: 'Час додано!'});
        }
        setEditingTime(null);
        setIsFormOpen(false);
    } catch (error) {
        console.error("Error saving time: ", error);
        toast({ variant: 'destructive', title: 'Помилка', description: 'Не вдалося зберегти час.'});
    }
  };

  const handleEdit = (lessonTime: LessonTime) => {
    setEditingTime(lessonTime);
    setIsFormOpen(true);
  };
  
  const handleDelete = async (id: string) => {
    try {
        const timeDoc = doc(db, 'lessonSchedule', id);
        await deleteDoc(timeDoc);
        toast({ title: 'Урок видалено.'});
    } catch (error) {
        console.error("Error deleting time: ", error);
        toast({ variant: 'destructive', title: 'Помилка', description: 'Не вдалося видалити урок.'});
    }
  }

  return (
    <Card className="border-0 shadow-none h-full flex flex-col">
        <CardHeader className="flex flex-col md:flex-row justify-between items-start md:items-center px-0">
            <div>
                <CardTitle>{label}</CardTitle>
                <CardDescription>Розклад для цього дня.</CardDescription>
            </div>
             <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
                if (!isOpen) setEditingTime(null);
                setIsFormOpen(isOpen);
             }}>
                <DialogTrigger asChild>
                    <Button onClick={() => setEditingTime(null)} className="mt-4 md:mt-0">
                        <PlusCircle className="mr-2 h-4 w-4" /> Додати урок
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingTime ? 'Редагувати' : 'Додати'} урок для: {label}</DialogTitle>
                    </DialogHeader>
                    <ScheduleForm
                        lessonTime={editingTime}
                        day={day}
                        onSave={handleSave}
                        onCancel={() => {
                            setEditingTime(null);
                            setIsFormOpen(false);
                        }}
                    />
                </DialogContent>
            </Dialog>
        </CardHeader>
        <CardContent className="px-0 flex-1 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Урок №</TableHead>
                <TableHead>Початок</TableHead>
                <TableHead>Кінець</TableHead>
                <TableHead className="text-right">Дії</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedule.length > 0 ? schedule.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.lessonNumber}</TableCell>
                  <TableCell className="font-mono">{item.startTime}</TableCell>
                  <TableCell className="font-mono">{item.endTime}</TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>Редагувати</Button>
                     <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">Видалити</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Ви впевнені?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Цю дію неможливо скасувати. Це назавжди видалить запис з розкладу.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Скасувати</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(item.id)}>Видалити</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              )) : (
                  <TableRow>
                      <TableCell colSpan={4} className="text-center h-24">Розклад для цього дня порожній.</TableCell>
                  </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
    </Card>
  )
}

export default function BellScheduleManager() {
  const [activeTab, setActiveTab] = useState<DayOfWeek>('monday');

  return (
    <div className="h-full flex flex-col">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DayOfWeek)} className="w-full flex-1 flex flex-col">
            <div className="overflow-x-auto">
              <TabsList className="inline-flex">
                  {daysOfWeek.map(({ value, label }) => (
                      <TabsTrigger key={value} value={value}>{label}</TabsTrigger>
                  ))}
              </TabsList>
            </div>
            {daysOfWeek.map(({ value, label }) => (
                <TabsContent key={value} value={value} className="m-0 flex-1 py-4 overflow-hidden">
                    <DailySchedule day={value} label={label} />
                </TabsContent>
            ))}
        </Tabs>
    </div>
  );
}
