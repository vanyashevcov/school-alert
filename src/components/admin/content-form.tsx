
'use client'

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { SlideContent } from '@/lib/types';
import { generateSchoolContent } from '@/ai/flows/content-generation';
import { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  type: z.enum(['text', 'image', 'video']),
  textType: z.enum(['normal', 'announcement', 'warning', 'urgent']).optional(),
  title: z.string().optional(),
  content: z.string().min(1, 'Контент не може бути порожнім.'),
  duration: z.coerce.number().min(1, 'Тривалість має бути не менше 1 секунди.'),
});

type ContentFormValues = z.infer<typeof formSchema>;

interface ContentFormProps {
    slide: SlideContent | null;
    onSave: (data: ContentFormValues) => void;
    onCancel: () => void;
}

export function ContentForm({ slide, onSave, onCancel }: ContentFormProps) {
  const form = useForm<ContentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: slide ? {
        ...slide,
        duration: slide.duration || 10,
        textType: slide.textType || 'normal',
    } : {
      type: 'text',
      textType: 'normal',
      title: '',
      content: '',
      duration: 10,
    },
  });
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const watchType = form.watch('type');

  function onSubmit(data: ContentFormValues) {
    const finalData = {
        ...data,
        textType: data.type === 'text' ? data.textType : undefined,
    }
    onSave(finalData);
  }

  const handleGenerateContent = async () => {
      const prompt = form.getValues('title') || "цікавий факт про навчання";
      setIsGenerating(true);
      try {
          const result = await generateSchoolContent({ prompt });
          if (result.content) {
            form.setValue('content', result.content, { shouldValidate: true });
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-2 gap-4">
            <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Тип слайду</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger><SelectValue placeholder="Оберіть тип" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    <SelectItem value="text">Текст</SelectItem>
                    <SelectItem value="image">Зображення</SelectItem>
                    <SelectItem value="video">Відео (YouTube)</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
            { watchType !== 'video' && (
                <FormField
                    control={form.control}
                    name="duration"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Тривалість (сек)</FormLabel>
                        <FormControl><Input type="number" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            )}
        </div>
        
        {watchType === 'text' && (
             <FormField
                control={form.control}
                name="textType"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Тип текстового слайду</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger><SelectValue placeholder="Оберіть тип тексту" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="normal">Звичайне</SelectItem>
                            <SelectItem value="announcement">Оголошення</SelectItem>
                            <SelectItem value="warning">Увага</SelectItem>
                            <SelectItem value="urgent">Терміново</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormDescription>
                        Це змінить вигляд текстового слайду.
                    </FormDescription>
                    <FormMessage />
                    </FormItem>
                )}
            />
        )}


        <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Заголовок (необов'язково)</FormLabel>
                <FormControl><Input placeholder="Наприклад, 'Важливе оголошення'" {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {watchType === 'text' && 'Текст слайду'}
                {watchType === 'image' && 'URL зображення'}
                {watchType === 'video' && 'ID відео YouTube'}
              </FormLabel>
              <FormControl>
                {watchType === 'text' ? (
                  <div className="relative">
                    <Textarea placeholder="Введіть текст..." {...field} />
                    <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="absolute bottom-2 right-2"
                        onClick={handleGenerateContent}
                        disabled={isGenerating}>
                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Згенерувати
                    </Button>
                  </div>
                ) : (
                  <Input placeholder={
                    watchType === 'image' ? 'https://...' : 'dQw4w9WgXcQ'
                  } {...field} />
                )}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>Скасувати</Button>
            <Button type="submit">Зберегти</Button>
        </div>
      </form>
    </Form>
  );
}
