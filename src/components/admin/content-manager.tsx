
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PlusCircle, FileText, Image as ImageIcon, Youtube } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { SlideContent } from '@/lib/types';
import { ContentForm } from './content-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

const getIcon = (type: SlideContent['type']) => {
    switch (type) {
        case 'text': return <FileText className="h-5 w-5 text-muted-foreground" />;
        case 'image': return <ImageIcon className="h-5 w-5 text-muted-foreground" />;
        case 'video': return <Youtube className="h-5 w-5 text-muted-foreground" />;
        default: return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
}

export default function ContentManager() {
  const [slides, setSlides] = useState<SlideContent[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSlide, setEditingSlide] = useState<SlideContent | null>(null);
  const { toast } = useToast();
  const slidesCollectionRef = collection(db, 'slides');

  useEffect(() => {
    const q = query(slidesCollectionRef, orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const slidesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as SlideContent[];
        setSlides(slidesData);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (slideData: Partial<Omit<SlideContent, 'id' | 'createdAt'>>) => {
    try {
      if (editingSlide) {
        const slideDoc = doc(db, 'slides', editingSlide.id);
        await updateDoc(slideDoc, slideData);
        toast({ title: 'Слайд оновлено!' });
      } else {
        await addDoc(slidesCollectionRef, { ...slideData, createdAt: new Date() });
        toast({ title: 'Слайд додано!' });
      }
      setEditingSlide(null);
      setIsFormOpen(false);
    } catch (error) {
        console.error("Error saving slide: ", error);
        toast({ variant: 'destructive', title: 'Помилка', description: 'Не вдалося зберегти слайд.'});
    }
  };

  const handleEdit = (slide: SlideContent) => {
    // If content starts with '/', assume it's a local image for editing purposes
    const slideForEditing = {...slide};
    if (slide.type === 'image' && slide.content.startsWith('/')) {
        slideForEditing.type = 'image-local' as 'image'; // Trick TS for the form
        slideForEditing.content = slide.content.substring(1);
    }
    setEditingSlide(slideForEditing);
    setIsFormOpen(true);
  };
  
  const handleDelete = async (id: string) => {
    try {
        const slideDoc = doc(db, 'slides', id);
        await deleteDoc(slideDoc);
        toast({ title: 'Слайд видалено.' });
    } catch (error) {
        console.error("Error deleting slide: ", error);
        toast({ variant: 'destructive', title: 'Помилка', description: 'Не вдалося видалити слайд.'});
    }
  }

  return (
    <Card className="border-0 shadow-none">
      <CardHeader className="p-0 mb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
                <CardDescription>Додавайте, редагуйте та видаляйте контент для головного екрану.</CardDescription>
            </div>
             <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
                if (!isOpen) setEditingSlide(null);
                 setIsFormOpen(isOpen);
             }}>
                <DialogTrigger asChild>
                    <Button onClick={() => setEditingSlide(null)} className="mt-4 sm:mt-0">
                        <PlusCircle className="mr-2 h-4 w-4" /> Додати слайд
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{editingSlide ? 'Редагувати' : 'Додати'} слайд</DialogTitle>
                    </DialogHeader>
                    <ContentForm 
                        slide={editingSlide} 
                        onSave={handleSave}
                        onCancel={() => {
                            setEditingSlide(null);
                            setIsFormOpen(false);
                        }}
                    />
                </DialogContent>
            </Dialog>
        </div>
      </CardHeader>
      <CardContent className="p-0">
       <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden md:table-cell">Тип</TableHead>
              <TableHead>Назва / Контент</TableHead>
              <TableHead className="text-right hidden sm:table-cell">Тривалість</TableHead>
              <TableHead className="text-right">Дії</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slides.length > 0 ? (
                slides.map(slide => (
                <TableRow key={slide.id}>
                    <TableCell className="hidden md:table-cell">{getIcon(slide.type)}</TableCell>
                    <TableCell className="font-medium">
                        <div className="font-bold">{slide.title || 'Без назви'}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-[200px] sm:max-w-xs">{slide.content}</div>
                    </TableCell>
                    <TableCell className="text-right hidden sm:table-cell">
                        {slide.type === 'video' ? 'Авто' : `${slide.duration} с.`}
                    </TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(slide)}>Редагувати</Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(slide.id)}>Видалити</Button>
                    </TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                       Слайдів ще немає. Додайте перший!
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  );
}
