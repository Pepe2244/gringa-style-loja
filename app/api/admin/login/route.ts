import { NextResponse } from 'next/server';
import { createAdminSession, isValidAdminPassword } from '@/lib/admin-auth';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== 'object' || !('password' in body)) {
      return NextResponse.json({ success: false, message: 'Dados inválidos.' }, { status: 400 });
    }

    if (!process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, message: 'Erro de configuração no servidor.' },
        { status: 500 }
      );
    }

    if (isValidAdminPassword(body.password)) {
      await createAdminSession();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: 'Senha incorreta' }, { status: 401 });
  } catch (error) {
    console.error('Admin login route error:', error);
    return NextResponse.json({ success: false, message: 'Erro interno do servidor' }, { status: 500 });
  }
}
