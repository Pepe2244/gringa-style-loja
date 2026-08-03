import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');

  return NextResponse.json({
    authenticated: session?.value === 'authenticated',
  });
}
