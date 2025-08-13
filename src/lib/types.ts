
import type { Timestamp } from 'firebase/firestore';

export type TextSlideType = 'normal' | 'announcement' | 'warning' | 'urgent';

export type SlideContent = {
  id: string;
  type: 'text' | 'image' | 'video' | 'image-local';
  content: string;
  title?: string;
  duration: number; // in seconds
  createdAt?: Timestamp;
  textType?: TextSlideType;
  textAlign?: 'left' | 'center' | 'right';
  fontSize?: number;
};

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type LessonTime = {
  id: string;
  lessonNumber: string;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  day: DayOfWeek;
};

export type NewsItem = {
    id: string;
    text: string;
    createdAt: Timestamp;
};

export type EmergencyAlert = {
    id: 'fireAlarm';
    isActive: boolean;
    message: string;
};
