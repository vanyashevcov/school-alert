
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
import { Sparkles, Loader2, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Slider } from '../ui/slider';

const formSchema = z.object({
  type: z.enum(['text', 'image', 'video']),
  textType: z.enum(['normal', 'announcement', 'warning', 'urgent']).optional(),
  textAlign: z.enum(['left', 'center', 'right']).optional(),
  fontSize: z.coerce.number().min(16).max(128).optional(),
  title: z.string().optional(),
  content: z.string().min(1, 'Контент не може бути порожнім.'),
  duration: z.coerce.number().min(1, 'Тривалість має бути не менше 1 секунди.'),
});

type ContentFormValues = z.infer<typeof formSchema>;

interface ContentFormProps {
    slide: SlideContent | null;
    onSave: (data: Partial<ContentFormValues>) => void;
    onCancel: () => void;
}

export function ContentForm({ slide, onSave, onCancel }: ContentFormProps) {
  const form = useForm<ContentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: slide ? {
        ...slide,
        duration: slide.duration || 10,
        textType: slide.textType || 'normal',
        textAlign: slide.textAlign || 'center',
        fontSize: slide.fontSize || 48,
    } : {
      type: 'text',
      textType: 'normal',
      textAlign: 'center',
      fontSize: 48,
      title: '',
      content: '',
      duration: 10,
    },
  });
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const watchType = form.watch('type');
  const watchFontSize = form.watch('fontSize');

  function onSubmit(data: ContentFormValues) {
    const finalData: Partial<ContentFormValues> = { ...data };
    if (data.type !== 'text') {
        delete finalData.textType;
        delete finalData.textAlign;
        delete finalData.fontSize;
    }
    onSave(finalData);
  }

  const handleGenerateContent = async () => {
      const prompt = form.getValues('title') || "цікавий факт про навчання";
      if (!prompt.trim()) {
          toast({ variant: 'destructive', title: 'Помилка', description: 'Будь ласка, введіть заголовок для генерації контенту.' });
          return;
      }
      setIsGenerating(true);
      try {
          const result = await generateSchoolContent({ prompt });
          if (result.content) {
            form.setValue('content', result.content, { shouldValidate: true });
            toast({ title: 'Контент згенеровано!', description: 'Перегляньте та відредагуйте результат.' });
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
            <>
            <div className="grid grid-cols-2 gap-4">
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
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="textAlign"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Вирівнювання тексту</FormLabel>
                            <FormControl>
                                <ToggleGroup 
                                    type="single"
                                    defaultValue={field.value}
                                    onValueChange={field.onChange}
                                    className="w-full"
                                    >
                                    <ToggleGroupItem value="left" aria-label="Вирівняти по лівому краю" className="w-full"><AlignLeft/></ToggleGroupItem>
                                    <ToggleGroupItem value="center" aria-label="Вирівняти по центру" className="w-full"><AlignCenter/></ToggleGroupItem>
                                    <ToggleGroupItem value="right" aria-label="Вирівняти по правому краю" className="w-full"><AlignRight/></ToggleGroupItem>
                                </ToggleGroup>
                            </FormControl>
                             <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
             <FormField
                control={form.control}
                name="fontSize"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Розмір шрифту - {watchFontSize}px</FormLabel>
                        <FormControl>
                            <Slider
                                value={[field.value || 48]}
                                onValueChange={(value) => field.onChange(value[0])}
                                min={16}
                                max={128}
                                step={1}
                             />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            </>
        )}


        <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Заголовок (використовується як промпт для AI)</FormLabel>
                <FormControl><Input placeholder="Наприклад, 'Цікаві факти про космос'" {...field} /></FormControl>
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
                  <Textarea placeholder="Введіть або згенеруйте текст..." {...field} rows={6} />
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

        {watchType === 'text' && (
            <div className="flex justify-start">
                 <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleGenerateContent}
                    disabled={isGenerating}>
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Згенерувати текст за заголовком
                </Button>
            </div>
        )}

        <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onCancel}>Скасувати</Button>
            <Button type="submit">Зберегти</Button>
        </div>
      </form>
    </Form>
  );
}
