'use server';

import {
    clearAdminSession,
    createAdminSession,
    isAdminAuthenticated,
    isValidAdminPassword,
} from '@/lib/admin-auth';

export async function loginAction(formData: FormData) {
    const password = formData.get('password') as string;

    if (!process.env.ADMIN_PASSWORD) {
        console.error("ERRO CRÍTICO DE SEGURANÇA: A variável ADMIN_PASSWORD não está configurada no painel do servidor.");
        return { success: false, message: 'Erro de configuração no servidor. Contate o suporte.' };
    }

    if (isValidAdminPassword(password)) {
        await createAdminSession();
        return { success: true }
    }

    return { success: false, message: 'Senha incorreta' }
}

export async function logoutAction() {
    await clearAdminSession();
}

export async function checkAuth() {
    return isAdminAuthenticated();
}