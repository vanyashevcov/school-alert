'use server';

import { z } from 'zod';
import { adminCredentials } from '@/lib/data';
import { redirect } from 'next/navigation';

const loginSchema = z.object({
  username: z.string().min(1, 'Ім\'я користувача є обов\'язковим'),
  password: z.string().min(1, 'Пароль є обов\'язковим'),
});

export async function login(prevState: any, formData: FormData) {
  try {
    const parsed = loginSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!parsed.success) {
      return { message: 'Надано невірні дані.', errors: parsed.error.flatten().fieldErrors };
    }
    
    const { username, password } = parsed.data;

    if (username === adminCredentials.username && password === adminCredentials.password) {
      // In a real app, you'd set a secure, httpOnly session cookie here.
      // For this demo, we'll just redirect.
      redirect('/admin/dashboard');
    } else {
      return { message: 'Невірний логін або пароль.' };
    }
  } catch (error) {
    return { message: 'Сталася помилка. Спробуйте ще раз.'}
  }
}
