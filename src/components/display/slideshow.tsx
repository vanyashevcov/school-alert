
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type SlideContent, type TextSlideType } from '@/lib/types';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Script from 'next/script';
import { cn } from '@/lib/utils';
import { Megaphone, AlertTriangle, Siren, Info } from 'lucide-react';

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

const textSlideConfig: Record<TextSlideType, { icon: React.FC<any>, cardClass: string, titleClass: string, iconClass: string, backgroundClass: string }> = {
    normal: {
        icon: Info,
        cardClass: 'bg-background/80 border-accent text-foreground',
        titleClass: 'text-primary',
        iconClass: 'text-primary',
        backgroundClass: 'from-slate-50 to-slate-200 dark:from-slate-800 dark:to-slate-900',
    },
    announcement: {
        icon: Megaphone,
        cardClass: 'bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-100',
        titleClass: 'text-blue-600 dark:text-blue-200',
        iconClass: 'text-blue-500 dark:text-blue-300',
        backgroundClass: 'from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50',
    },
    warning: {
        icon: AlertTriangle,
        cardClass: 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-100',
        titleClass: 'text-amber-600 dark:text-amber-200',
        iconClass: 'text-amber-500 dark:text-amber-300',
        backgroundClass: 'from-amber-100 to-amber-200 dark:from-amber-900/50 dark:to-amber-800/50',
    },
    urgent: {
        icon: Siren,
        cardClass: 'bg-red-500/10 border-red-500/30 text-red-900 dark:text-red-100',
        titleClass: 'text-red-600 dark:text-red-200',
        iconClass: 'text-red-500 dark:text-red-300',
        backgroundClass: 'from-red-100 to-red-200 dark:from-red-900/50 dark:to-red-800/50',
    }
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
    case 'text': {
      const config = textSlideConfig[slide.textType || 'normal'];
      const Icon = config.icon;
      return (
        <div className={cn("flex items-center justify-center h-full bg-gradient-to-br p-8", config.backgroundClass)}>
            <Card className={cn("max-w-5xl w-full text-center border-2 shadow-2xl transition-colors duration-500 rounded-2xl", config.cardClass)}>
              <CardHeader>
                 <div className="flex flex-col justify-center items-center gap-4">
                    <Icon className={cn("h-24 w-24 drop-shadow-lg", config.iconClass)} />
                    {slide.title && <CardTitle className={cn("text-6xl font-bold drop-shadow-sm", config.titleClass)}>{slide.title}</CardTitle>}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-5xl font-medium leading-tight text-balance">{slide.content}</p>
              </CardContent>
            </Card>
        </div>
      );
    }
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
