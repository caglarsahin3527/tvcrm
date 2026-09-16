import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, signSessionToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local-client';
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'E-posta ve şifre gereklidir.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const rateLimitKey = `login:${ip}:${normalizedEmail}`;

    // Rate Limit Check (5 attempts in 5 minutes)
    const rateCheck = checkRateLimit(rateLimitKey, { maxAttempts: 5, windowMs: 5 * 60 * 1000 });
    if (rateCheck.isBlocked) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Çok fazla hatalı giriş denemesi yapıldı. Lütfen ${rateCheck.retryAfterSeconds} saniye sonra tekrar deneyiniz.` 
        },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      recordFailedAttempt(rateLimitKey);
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı veya şifre hatalı.' },
        { status: 401 }
      );
    }

    // Verify password
    const isMatch = verifyPassword(password, user.password);
    if (!isMatch) {
      recordFailedAttempt(rateLimitKey);
      return NextResponse.json(
        { success: false, error: 'Kullanıcı bulunamadı veya şifre hatalı.' },
        { status: 401 }
      );
    }

    // Successful login: reset failed attempts
    resetRateLimit(rateLimitKey);

    // Sign session token
    const token = signSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        target: user.target,
        phone: user.phone,
        avatar: user.avatar,
      },
    });

    // Set HTTP-only secure cookie
    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Giriş sırasında bir hata oluştu.' },
      { status: 500 }
    );
  }
}
