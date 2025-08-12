
import type { Timestamp } from 'firebase/firestore';

export type TextSlideType = 'normal' | 'announcement' | 'warning' | 'urgent';

export type SlideContent = {
  id: string;
  type: 'text' | 'image' | 'video';
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

export type AirRaidAlert = {
  id: number;
  location_title: string;
  location_type: 'oblast' | 'raion' | 'city' | 'hromada' | 'unknown';
  started_at: string; // ISO 8601 date string
  finished_at: string | null;
  updated_at: string; // ISO 8601 date string
  alert_type: 'air_raid' | 'artillery_shelling' | 'urban_fights' | 'chemical' | 'nuclear';
  location_uid: string;
  location_oblast: string;
  location_oblast_uid: string;
  location_raion: string;
  notes: string;
  calculated: boolean;
};

export type AirRaidAlertResponse = {
  alerts: AirRaidAlert[];
}
