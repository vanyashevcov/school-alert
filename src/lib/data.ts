
import type { SlideContent } from '@/lib/types';

// This data is now stored in Firestore and will be removed.
// It is kept here as a reference or for fallback if needed.
export const initialSlides: SlideContent[] = [];

// Admin credentials are now managed by Firebase Authentication.
// This is no longer used for login but can be kept for other purposes if needed.
export const adminCredentials = {
  username: 'admin',
  password: 'password',
};
