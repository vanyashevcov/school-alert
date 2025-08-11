import AirRaidAlert from '@/components/display/air-raid-alert';
import AudioEnabler from '@/components/display/audio-enabler';
import BellSystem from '@/components/display/bell-system';
import NewsTicker from '@/components/display/news-ticker';
import Slideshow from '@/components/display/slideshow';
import TimeAndDate from '@/components/display/time-and-date';

export default function Home() {
  return (
    <div className="relative flex h-full w-full flex-col">
      <AudioEnabler />
      <AirRaidAlert />
      <BellSystem />
      <header className="absolute top-4 left-4 z-10 bg-black/20 p-4 rounded-lg">
        <TimeAndDate />
      </header>
      <main className="flex-1">
        <Slideshow />
      </main>
      <footer className="absolute bottom-0 left-0 right-0 z-10 h-16">
        <NewsTicker />
      </footer>
    </div>
  );
}
