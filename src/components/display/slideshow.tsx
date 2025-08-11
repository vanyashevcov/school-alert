
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type SlideContent } from '@/lib/types';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Script from 'next/script';
import { cn } from '@/lib/utils';

// Augment the window object
declare global {
    interface Window {
        onYouTubeIframeAPIReady: () => void;
        YT: any;
    }
}

function YouTubePlayer({ videoId, onEnd, onReady, isActive }: { videoId: string, onEnd: () => void, onReady: () => void, isActive: boolean }) {
    const playerRef = useRef<any>(null);
    const playerContainerId = `youtube-player-${videoId}-${Math.random()}`;

    useEffect(() => {
        if (!isActive) {
            if (playerRef.current) {
                playerRef.current.destroy();
                playerRef.current = null;
            }
            return;
        }

        const createPlayer = () => {
            if (playerRef.current) {
                 playerRef.current.destroy();
            }
            playerRef.current = new window.YT.Player(playerContainerId, {
                videoId: videoId,
                playerVars: {
                    autoplay: 1,
                    controls: 0,
                    loop: 0, 
                    modestbranding: 1,
                    rel: 0
                },
                events: {
                    'onReady': () => {
                        onReady();
                        playerRef.current?.playVideo();
                    },
                    'onStateChange': (event: any) => {
                        if (event.data === window.YT.PlayerState.ENDED) {
                            onEnd();
                        }
                    }
                }
            });
        }

        if (!window.YT) {
            // If YT API is not ready, wait for it
            const interval = setInterval(() => {
                if (window.YT && window.YT.Player) {
                    clearInterval(interval);
                    createPlayer();
                }
            }, 100);
        } else {
             createPlayer();
        }

        return () => {
             if (playerRef.current) {
                playerRef.current.destroy();
                playerRef.current = null;
            }
        };

    }, [isActive, videoId, onEnd, onReady, playerContainerId]);

    return <div id={playerContainerId} className="w-full h-full"></div>;
}


function Slide({ slide, onVideoEnd, onVideoReady, isActive }: { slide: SlideContent; isActive: boolean; onVideoEnd: () => void; onVideoReady: () => void; }) {
  switch (slide.type) {
    case 'image':
      return (
        <Image
          src={slide.content}
          alt={slide.title || 'Зображення для слайду'}
          fill
          className="object-contain h-full"
          data-ai-hint="school life"
        />
      );
    case 'video':
      return (
         <YouTubePlayer 
            videoId={slide.content}
            onEnd={onVideoEnd}
            onReady={onVideoReady}
            isActive={isActive}
        />
      );
    case 'text':
      return (
        <div className="flex items-center justify-center h-full bg-primary/90 backdrop-blur-sm p-8">
            <Card className="max-w-4xl text-center bg-background/80 border-2 border-accent shadow-2xl">
              <CardHeader>
                <CardTitle className="text-5xl font-bold text-primary">{slide.title}</CardTitle>
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
  const [slides, setSlides] = useState<SlideContent[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isApiReady, setIsApiReady] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    window.onYouTubeIframeAPIReady = () => {
      setIsApiReady(true);
    };
  }, []);


  useEffect(() => {
    const q = query(collection(db, 'slides'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const slidesData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as SlideContent[];
        setSlides(slidesData);
    });
    return () => unsubscribe();
  }, []);

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };
  
  const setupTimeout = () => {
    if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
    }
    if (slides.length === 0) return;
    
    const currentSlideData = slides[currentSlide];
    if (!currentSlideData || currentSlideData.type === 'video') return;

    timeoutRef.current = setTimeout(handleNext, currentSlideData.duration * 1000);
  }

  useEffect(() => {
    setupTimeout();
    
    return () => {
      if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
      }
    };
  }, [currentSlide, slides]);
  

  if (slides.length === 0) {
    return <div className="flex items-center justify-center h-full">Завантаження слайдів...</div>
  }

  return (
    <div className="relative w-full h-full bg-black">
      <Script src="https://www.youtube.com/iframe_api" strategy="lazyOnload" />
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={cn(
            'absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out',
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          )}
        >
          <Slide 
              slide={slide} 
              isActive={index === currentSlide} 
              onVideoEnd={handleNext}
              onVideoReady={() => {
                  if(timeoutRef.current) clearTimeout(timeoutRef.current)
              }}
          />
        </div>
      ))}
    </div>
  );
}
