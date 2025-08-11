export type SlideContent = {
  id: string;
  type: 'text' | 'image' | 'video';
  content: string;
  title?: string;
  duration: number; // in seconds
};

export type BellTime = {
  id: string;
  time: string; // "HH:mm"
  label: string;
};
