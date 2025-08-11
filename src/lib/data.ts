import type { SlideContent, BellTime } from '@/lib/types';

export const initialSlides: SlideContent[] = [
  {
    id: '1',
    type: 'text',
    title: 'Ласкаво просимо!',
    content: 'Вітаємо у нашому освітньому закладі. Бажаємо продуктивного дня!',
    duration: 15,
  },
  {
    id: '2',
    type: 'image',
    content: 'https://placehold.co/1920x1080.png',
    duration: 10,
  },
  {
    id: '3',
    type: 'video',
    content: 'dQw4w9WgXcQ', // Video ID
    duration: 20,
  },
  {
    id: '4',
    type: 'text',
    title: 'Розклад уроків',
    content: 'Слідкуйте за оновленнями розкладу на інформаційному стенді.',
    duration: 15,
  },
];

export const initialBellSchedule: BellTime[] = [
    { id: 'b1', time: '08:30', label: 'Початок 1-го уроку' },
    { id: 'b2', time: '09:15', label: 'Кінець 1-го уроку' },
    { id: 'b3', time: '09:25', label: 'Початок 2-го уроку' },
    { id: 'b4', time: '10:10', label: 'Кінець 2-го уроку' },
    { id: 'b5', time: '10:30', label: 'Початок 3-го уроку' },
    { id: 'b6', time: '11:15', label: 'Кінець 3-го уроку' },
];

export const adminCredentials = {
  username: 'admin',
  password: 'password',
};
