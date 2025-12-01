'use server'

import { cookies } from 'next/headers'

export async function loginAction(formData: FormData) {
    const password = formData.get('password') as string;

    // A senha agora vem EXCLUSIVAMENTE da variável de ambiente do servidor
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
        console.error("ERRO CRÍTICO DE SEGURANÇA: A variável ADMIN_PASSWORD não está configurada no painel do servidor.");
        return { success: false, message: 'Erro de configuração no servidor. Contate o suporte.' };
    }

    if (password && password.trim() === adminPassword.trim()) {
        const cookieStore = await cookies()
        cookieStore.set('admin_session', 'authenticated', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7, // 1 semana
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