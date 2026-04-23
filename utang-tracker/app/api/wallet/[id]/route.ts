import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const res  = await fetch(`${API_URL}/wallet/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' },
  });
  const text = await res.text();
  if (!text) return NextResponse.json({ success: true }, { status: 200 });
  try {
    return NextResponse.json(JSON.parse(text), { status: res.status });
  } catch {
    return NextResponse.json({ message: 'Invalid response', detail: text }, { status: 500 });
  }
}