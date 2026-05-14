import { NextResponse, type NextRequest } from 'next/server';

// Minimal middleware — just passes requests through.
// Auth session refresh is handled client-side by the Supabase browser client.
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
