'use server'

import { cookies } from 'next/headers'

export async function loginAction(formData: FormData) {
    const password = formData.get('password')
    const adminPassword = process.env.ADMIN_PASSWORD;

    console.log('Login attempt:', {
        receivedPassword: password,
        envPasswordExists: !!adminPassword,
        match: password === adminPassword
    });

    if (password === adminPassword) {
        const cookieStore = await cookies()
        cookieStore.set('admin_session', 'authenticated', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        })
        return { success: true }
    }

    return { success: false, message: 'Senha incorreta' }
}

export async function logoutAction() {
    const cookieStore = await cookies()
    cookieStore.delete('admin_session')
}

export async function checkAuth() {
    const cookieStore = await cookies()
    const session = cookieStore.get('admin_session')
    return session?.value === 'authenticated'
}
