
'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
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
    
    return { message: 'Успішний вхід. Перенаправлення...' };


  } catch (error: any) {
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

export async function getPoltavaAlertStatus(): Promise<string> {
    const apiKey = process.env.ALERTS_IN_UA_API_KEY;
    const poltavaOblastUID = '19';

    if (!apiKey) {
        console.error("ALERTS_IN_UA_API_KEY is not set in .env");
        return "N"; // Default to safe status if no key
    }

    try {
        const response = await fetch(`https://api.alerts.in.ua/v1/iot/active_air_raid_alerts/${poltavaOblastUID}.json?token=${apiKey}`);
        
        if (response.ok) {
            const status = await response.json() as string;
            // The API returns a plain string like "A", "P", or "N". No need to process it further.
            return status;
        } else {
             const errorBody = await response.text();
             console.error(`API call failed with status: ${response.status}`, errorBody);
             // Return "N" as a safe default if API fails
             return "N";
        }
    } catch (error) {
        console.error('Failed to fetch air raid status:', error);
        // Return "N" as a safe default in case of any error
        return "N"; 
    }
}
