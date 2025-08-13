
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PlusCircle, Newspaper, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { NewsItem } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { generateSchoolContent } from '@/ai/flows/content-generation';
import { Input } from '../ui/input';


function NewsForm({ onSave, onCancel, newsItem }: { onSave: (text: string) => void, onCancel: () => void, newsItem: NewsItem | null }) {
    const [text, setText] = useState(newsItem?.text || '');
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSave(text);
    }
    
    const handleGenerateContent = async () => {
        if (!prompt.trim()) {
            toast({ variant: 'destructive', title: 'Помилка', description: 'Будь ласка, введіть тему для генерації новини.' });
            return;
        }
        setIsGenerating(true);
        try {
            const result = await generateSchoolContent({ prompt: `Напиши коротку новину для школи на тему: ${prompt}` });
            if (result.content) {
              setText(result.content);
              toast({ title: 'Новину згенеровано!'});
            } else {
               toast({ variant: 'destructive', title: 'Помилка генерації', description: 'Не вдалося згенерувати контент.' });
            }
        } catch (error) {
             toast({ variant: 'destructive', title: 'Помилка генерації', description: 'Сталася помилка під час звернення до AI.' });
        } finally {
            setIsGenerating(false);
        }
    }


    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="newsPrompt">Тема для генерації (AI)</Label>
                <div className="flex gap-2">
                    <Input id="newsPrompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Наприклад, 'шкільний ярмарок'"/>
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleGenerateContent}
                        disabled={isGenerating}>
                        {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles />}
                        <span className="hidden sm:inline ml-2">Згенерувати</span>
                    </Button>
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="newsText">Текст новини</Label>
                <Textarea id="newsText" value={text} onChange={(e) => setText(e.target.value)} placeholder="Введіть текст новини..." required rows={5}/>
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel}>Скасувати</Button>
                <Button type="submit">Зберегти</Button>
            </div>
        </form>
    )
}

export default function NewsTickerManager() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const { toast } = useToast();
  const newsCollectionRef = collection(db, 'newsItems');

  useEffect(() => {
    const q = query(newsCollectionRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const newsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as NewsItem[];
        setNews(newsData);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (text: string) => {
    try {
      if (editingNews) {
        const newsDoc = doc(db, 'newsItems', editingNews.id);
        await updateDoc(newsDoc, { text });
        toast({ title: 'Новину оновлено!' });
      } else {
        await addDoc(newsCollectionRef, { text, createdAt: new Date() });
        toast({ title: 'Новину додано!' });
      }
      setEditingNews(null);
      setIsFormOpen(false);
    } catch (error) {
        console.error("Error saving news item: ", error);
        toast({ variant: 'destructive', title: 'Помилка', description: 'Не вдалося зберегти новину.'});
    }
  };

  const handleEdit = (item: NewsItem) => {
    setEditingNews(item);
    setIsFormOpen(true);
  };
  
  const handleDelete = async (id: string) => {
    if (!window.confirm("Ви впевнені, що хочете видалити цю новину?")) return;
    try {
        const newsDoc = doc(db, 'newsItems', id);
        await deleteDoc(newsDoc);
        toast({ title: 'Новину видалено.' });
    } catch (error) {
        console.error("Error deleting news item: ", error);
        toast({ variant: 'destructive', title: 'Помилка', description: 'Не вдалося видалити новину.'});
    }
  }

  return (
    <Card className="h-full border-0 rounded-none shadow-none flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardDescription>Керуйте новинами, що відображаються у біжучому рядку.</CardDescription>
            </div>
             <Dialog open={isFormOpen} onOpenChange={(isOpen) => {
                if (!isOpen) setEditingNews(null);
                setIsFormOpen(isOpen);
             }}>
                <DialogTrigger asChild>
                    <Button onClick={() => setEditingNews(null)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Додати новину
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[625px]">
                    <DialogHeader>
                        <DialogTitle>{editingNews ? 'Редагувати' : 'Додати'} новину</DialogTitle>
                    </DialogHeader>
                    <NewsForm 
                        newsItem={editingNews} 
                        onSave={handleSave}
                        onCancel={() => {
                            setEditingNews(null);
                            setIsFormOpen(false);
                        }}
                    />
                </DialogContent>
            </Dialog>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Текст новини</TableHead>
              <TableHead className="text-right">Дії</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {news.length > 0 ? (
                news.map(item => (
                <TableRow key={item.id}>
                    <TableCell className="font-medium">
                        <p className="truncate max-w-lg">{item.text}</p>
                    </TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>Редагувати</Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(item.id)}>Видалити</Button>
                    </TableCell>
                </TableRow>
                ))
            ) : (
                <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">
                       Новин ще немає. Додайте першу!
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
