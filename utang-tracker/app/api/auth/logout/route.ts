import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const res = NextResponse.json({ message: 'Logged out successfully' });
    res.cookies.set('auth_token', '', {
      httpOnly: true,
      expires: new Date(0),
    });
    return res;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
