import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin-auth';

export async function POST() {
  if (!await isAdminAuthenticated()) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  revalidatePath('/', 'layout');
  return NextResponse.json({ success: true });
}
