
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

const textSlideConfig: Record<TextSlideType, { icon: React.FC<any>, cardClass: string, titleClass: string }> = {
    normal: {
        icon: Info,
        cardClass: 'bg-background/80 border-accent',
        titleClass: 'text-primary'
    },
    announcement: {
        icon: Megaphone,
        cardClass: 'bg-blue-800/80 border-blue-400',
        titleClass: 'text-blue-100'
    },
    warning: {
        icon: AlertTriangle,
        cardClass: 'bg-yellow-600/80 border-yellow-300',
        titleClass: 'text-yellow-100'
    },
    urgent: {
        icon: Siren,
        cardClass: 'bg-red-800/80 border-red-400',
        titleClass: 'text-red-100'
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
        <div className="flex items-center justify-center h-full bg-primary/90 backdrop-blur-sm p-8">
            <Card className={cn("max-w-4xl w-full text-center border-2 shadow-2xl transition-colors duration-500", config.cardClass)}>
              <CardHeader>
                 <div className="flex justify-center items-center gap-4">
                    <Icon className={cn("h-12 w-12", config.titleClass)} />
                    <CardTitle className={cn("text-5xl font-bold", config.titleClass)}>{slide.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-4xl text-foreground/90">{slide.content}</p>
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
