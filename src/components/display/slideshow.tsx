
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type SlideContent, type TextSlideType, type EmergencyAlert } from '@/lib/types';
import { type AirRaidAlertOutput } from '@/ai/flows/air-raid-alert-reasoning';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Script from 'next/script';
import { cn } from '@/lib/utils';
import { Megaphone, AlertTriangle, Siren, Info, Flame } from 'lucide-react';

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
                try {
                    playerRef.current.destroy();
                } catch (e) {
                    console.error("Error destroying player", e);
                }
                playerRef.current = null;
            }
            return;
        }

        const createPlayer = () => {
            if (playerRef.current) {
                 try {
                    playerRef.current.destroy();
                } catch (e) {
                    console.error("Error destroying player", e);
                }
            }
            playerRef.current = new window.YT.Player(playerContainerId, {
                videoId: videoId,
                playerVars: {
                    autoplay: 1,
                    controls: 0,
                    loop: 0, 
                    modestbranding: 1,
                    rel: 0,
                    playsinline: 1
                },
                events: {
                    'onReady': (event: any) => {
                        onReady();
                        event.target.playVideo();
                        event.target.mute(); // Mute for autoplay policies
                    },
                    'onStateChange': (event: any) => {
                        if (event.data === window.YT.PlayerState.ENDED) {
                            onEnd();
                        }
                    }
                }
            });
        }

        if (window.YT && window.YT.Player) {
            createPlayer();
        } else {
             window.onYouTubeIframeAPIReady = () => {
                createPlayer();
            };
        }

        return () => {
             if (playerRef.current) {
                try {
                    playerRef.current.destroy();
                } catch (e) {
                    console.error("Error destroying player", e)
                }
                playerRef.current = null;
            }
        };

    }, [isActive, videoId, onEnd, onReady, playerContainerId]);
    
    // Using iframe directly with src params for autoplay, as YT.Player can be tricky with frameworks
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
      const textAlign = slide.textAlign || 'center';
      const fontSize = slide.fontSize || 48;

      return (
        <div className={cn("flex items-center justify-center h-full bg-gradient-to-br p-8", config.backgroundClass)}>
            <Card className={cn("max-w-5xl w-full max-h-[90vh] flex flex-col border-2 shadow-2xl transition-colors duration-500 rounded-2xl", config.cardClass, `text-${textAlign}`)}>
              <CardHeader>
                 <div className="flex flex-col justify-center items-center gap-4">
                    <Icon className={cn("h-16 md:h-24 w-16 md:w-24 drop-shadow-lg", config.iconClass)} />
                    {slide.title && <CardTitle className={cn("text-4xl md:text-6xl font-bold drop-shadow-sm", config.titleClass)}>{slide.title}</CardTitle>}
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-6 flex flex-col justify-center">
                 <div className="flex items-center justify-center h-full">
                    <p 
                        className="font-medium leading-tight text-balance whitespace-pre-wrap"
                        style={{ fontSize: `${fontSize}px` }}
                        dangerouslySetInnerHTML={{ __html: slide.content }}
                    ></p>
                 </div>
              </CardContent>
            </Card>
        </div>
      );
    }
    default:
      return null;
  }
}

function AlertSlide({title, message, icon: Icon, configKey = 'urgent'}: {title: string, message: string, icon: React.FC<any>, configKey?: TextSlideType}) {
    const config = textSlideConfig[configKey];
    return (
        <div className={cn("flex items-center justify-center h-full bg-gradient-to-br p-8 animate-pulse", config.backgroundClass)}>
            <Card className={cn("max-w-5xl w-full max-h-[90vh] flex flex-col border-2 shadow-2xl transition-colors duration-500 rounded-2xl", config.cardClass, "text-center")}>
                <CardHeader>
                    <div className="flex flex-col justify-center items-center gap-4">
                        <Icon className={cn("h-24 md:h-32 w-24 md:w-32 drop-shadow-lg", config.iconClass)} />
                        <CardTitle className={cn("text-5xl md:text-8xl font-black drop-shadow-sm", config.titleClass)}>{title}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto p-6 flex flex-col justify-center">
                    <p className="text-4xl md:text-6xl font-bold leading-tight" dangerouslySetInnerHTML={{ __html: message }}></p>
                </CardContent>
            </Card>
        </div>
    )
}

export default function Slideshow({ isAlertActive, fireAlert, airRaidAlert }: { isAlertActive: boolean; fireAlert: EmergencyAlert | null; airRaidAlert: AirRaidAlertOutput | null }) {
  const [slides, setSlides] = useState<SlideContent[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // If onYouTubeIframeAPIReady is not on window, set it.
    if (typeof window !== 'undefined' && !window.onYouTubeIframeAPIReady) {
      window.onYouTubeIframeAPIReady = () => {
        // This function can be called by multiple players,
        // so we just need to signal that the API is ready.
        // The players themselves will be created in their useEffect.
      };
    }
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
    if (slides.length === 0 || isAlertActive) return;
    
    const currentSlideData = slides[currentSlide];
    if (!currentSlideData || currentSlideData.type === 'video') return;

    timeoutRef.current = setTimeout(handleNext, (currentSlideData.duration || 10) * 1000);
  }

  useEffect(() => {
    setupTimeout();
    
    return () => {
      if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
      }
    };
  }, [currentSlide, slides, isAlertActive]);
  

  if (fireAlert?.isActive) {
      return <AlertSlide title="Пожежна тривога!" message={fireAlert.message} icon={Flame} configKey="urgent" />;
  }

  if (airRaidAlert?.shouldAlert) {
      return <AlertSlide title="Повітряна тривога!" message="Пройдіть в укриття!" icon={Siren} configKey="urgent" />;
  }

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
