
import type { Timestamp } from 'firebase/firestore';

export type SlideContent = {
  id: string;
  type: 'text' | 'image' | 'video';
  content: string;
  title?: string;
  duration: number; // in seconds
  createdAt?: Timestamp; 
};

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type BellTime = {
  id: string;
  time: string; // "HH:mm"
  label: string;
  day: DayOfWeek;
};

