import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const scriptUrl = process.env.GOOGLE_SCRIPT_URL;

    if (!scriptUrl) {
      console.warn('GOOGLE_SCRIPT_URL이 설정되지 않았습니다. .env.local 파일을 확인해주세요.');
      return NextResponse.json({ message: 'Google Script URL not configured' }, { status: 200 });
    }

    // Google Apps Script로 데이터 전송
    const response = await fetch(scriptUrl, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
