
'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';

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
    return new Promise((resolve) => {
        const apiKey = "e887858b239034e45ea7f086c08c54a87506c0b1ab2203"; // Прямо в коді для тесту
        const poltavaUID = 1060;

        const https = require("https");
        const url = `https://api.alerts.in.ua/v1/iot/active_air_raid_alerts.json?token=${apiKey}`;

        https.get(url, (res: any) => {
            let data = "";

            res.on("data", (chunk: Buffer) => {
                data += chunk.toString();
            });

            res.on("end", () => {
                if (res.statusCode === 200) {
                    // Тут "data" — це вже чистий рядок з N/A/P
                    const statusesString = data.trim();

                    if (statusesString.length > poltavaUID) {
                        const status = statusesString.charAt(poltavaUID);
                        // Якщо символ не A або P — вважаємо, що тривоги немає
                        resolve(["A", "P"].includes(status) ? status : "N");
                    } else {
                        console.error(`Строка занадто коротка. Довжина: ${statusesString.length}, UID: ${poltavaUID}`);
                        resolve("N");
                    }
                } else {
                    console.error(`Помилка API: ${res.statusCode} - ${data}`);
                    resolve("N");
                }
            });
        }).on("error", (err: Error) => {
            console.error("Помилка запиту:", err.message);
            resolve("N");
        });
    });
}
