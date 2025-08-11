'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from '@/components/ui/carousel';
import { initialSlides } from '@/lib/data';
import { type SlideContent } from '@/lib/types';
import { cn } from '@/lib/utils';

function Slide({ slide, isActive }: { slide: SlideContent; isActive: boolean }) {
  switch (slide.type) {
    case 'image':
      return (
        <Image
          src={slide.content}
          alt={slide.title || 'Зображення для слайду'}
          fill
          className="object-cover"
          data-ai-hint="school life"
        />
      );
    case 'video':
      return (
        <iframe
          src={`https://www.youtube.com/embed/${slide.content}?autoplay=${isActive ? 1 : 0}&mute=1&controls=0&loop=1&playlist=${slide.content}`}
          title={slide.title || 'YouTube video player'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full border-0"
        ></iframe>
      );
    case 'text':
      return (
        <div className="flex items-center justify-center h-full bg-primary/90 backdrop-blur-sm p-8">
            <Card className="max-w-4xl text-center bg-background/80 border-2 border-accent shadow-2xl">
              <CardHeader>
                <CardTitle className="text-7xl font-bold text-primary">{slide.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl text-foreground/80">{slide.content}</p>
              </CardContent>
            </Card>
        </div>
      );
    default:
      return null;
  }
}

export default function Slideshow() {
  const [api, setApi] = useState<CarouselApi>();
  const [slides] = useState<SlideContent[]>(initialSlides);
  const [currentSlide, setCurrentSlide] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setCurrentSlide(api.selectedScrollSnap());
    };

    api.on('select', onSelect);
    return () => {
      api.off('select', onSelect);
    };
  }, [api]);
  
  useEffect(() => {
    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
    }
    if (!api) return;

    const currentSlideData = slides[currentSlide];
    if (!currentSlideData) return;

    timeoutRef.current = setTimeout(() => {
        api.scrollNext();
    }, currentSlideData.duration * 1000);

    return () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    };
  }, [api, currentSlide, slides]);

  return (
    <Carousel setApi={setApi} className="w-full h-full">
      <CarouselContent>
        {slides.map((slide, index) => (
          <CarouselItem key={slide.id}>
            <div className="relative w-full h-full">
                <Slide slide={slide} isActive={index === currentSlide} />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
}
