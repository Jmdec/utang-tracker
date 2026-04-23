import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    console.log('[contacts GET] Fetching from:', `${API_URL}/contacts`);

    const res = await fetch(`${API_URL}/contacts`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    console.log('[contacts GET] Laravel response status:', res.status);

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });

  } catch (error) {
    console.error('[contacts GET] Error:', error);
    return NextResponse.json(
      { message: 'Could not reach the server. Is Laravel running?' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    console.log('[contacts POST] Posting to:', `${API_URL}/contacts`);

    const res = await fetch(`${API_URL}/contacts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    console.log('[contacts POST] Laravel response status:', res.status);

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });

  } catch (error) {
    console.error('[contacts POST] Error:', error);
    return NextResponse.json(
      { message: 'Could not reach the server. Is Laravel running?' },
      { status: 500 }
    );
  }
}