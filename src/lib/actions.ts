
'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import https from 'https';

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
    return new Promise((resolve, reject) => {
        const apiKey = process.env.ALERTS_IN_UA_API_KEY;
        // UID for Poltava city
        const poltavaUID = 1060;

        if (!apiKey) {
            console.error("ALERTS_IN_UA_API_KEY is not set in .env");
            resolve("N"); // Default to safe status if no key
            return;
        }

        const url = `https://api.alerts.in.ua/v1/iot/active_air_raid_alerts.json?token=${apiKey}`;

        const req = https.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    try {
                        // The response is a single long string, not JSON.
                        const statusesString = data;
                        if (statusesString.length > poltavaUID) {
                            const status = statusesString.charAt(poltavaUID);
                            // Return 'N' for space or any other unexpected character
                            resolve(['A', 'P'].includes(status) ? status : 'N');
                        } else {
                            console.error(`Statuses string is too short. Length: ${statusesString.length}, UID: ${poltavaUID}`);
                            resolve("N");
                        }
                    } catch (e: any) {
                        console.error('Error parsing response from alerts API:', e.message);
                        resolve("N");
                    }
                } else {
                    console.error(`API call failed with status: ${res.statusCode}`, data);
                    resolve("N");
                }
            });
        });

        req.on('error', (error) => {
            console.error('Failed to fetch air raid status with https module:', error);
            resolve("N");
        });

        req.end();
    });
}
