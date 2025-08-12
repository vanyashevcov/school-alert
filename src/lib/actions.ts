
'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Assuming firebase is initialized here
import fetch from 'node-fetch';

const loginSchema = z.object({
  email: z.string().email("Невірний формат електронної пошти"),
  password: z.string().min(6, 'Пароль має містити щонайменше 6 символів'),
});

export async function login(prevState: any, formData: FormData) {
  try {
    const parsed = loginSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!parsed.success) {
      return { message: 'Надано невірні дані.', errors: parsed.error.flatten().fieldErrors };
    }

    // This is a server action, but Firebase Auth client SDK is needed for login.
    // This will not work directly. We need to handle auth on the client-side.
    // For now, this is a placeholder to show the intent.
    // In a real app, you would handle the sign-in on the client and send the ID token to the server to create a session cookie.
    
    // The following code will not execute successfully on the server.
    // It's here to represent the logic that needs to move to the client.
    
    return { message: 'Успішний вхід. Перенаправлення...' };


  } catch (error: any) {
    // Basic error handling
    if (error.code) {
        switch (error.code) {
            case 'auth/user-not-found':
            case 'auth/wrong-password':
            case 'auth/invalid-credential':
                return { message: 'Невірний логін або пароль.' };
            default:
                return { message: 'Сталася помилка автентифікації.' };
        }
    }
    return { message: 'Сталася невідома помилка. Спробуйте ще раз.'};
  }
}

// Dummy action, as we can't sign out from the server without custom logic
export async function logout() {
    redirect('/');
}

type AirRaidAlert = {
    id: string;
    location_title: string;
    location_type: string;
    alert_type: string;
}

export async function getAirRaidAlerts(): Promise<AirRaidAlert[]> {
    const apiKey = process.env.ALERTS_IN_UA_API_KEY;
    if (!apiKey) {
        console.error("ALERTS_IN_UA_API_KEY is not set in .env");
        return [];
    }

    try {
        const response = await fetch('https://alerts.in.ua/v1/alerts/active.json', {
            headers: {
                // @ts-ignore
                'X-API-Key': apiKey,
            },
        });

        if (!response.ok) {
            throw new Error(`API call failed with status: ${response.status}`);
        }

        const data = (await response.json()) as { alerts: AirRaidAlert[] };
        return data.alerts;
    } catch (error) {
        console.error('Failed to fetch air raid alerts:', error);
        return [];
    }
}
