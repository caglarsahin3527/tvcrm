import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUserFast, hashPassword, verifyPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PUT(request: NextRequest) {
  try {
    const sessionUser = await getSessionUserFast();
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Oturum açılmalıdır.' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, avatar, currentPassword, newPassword } = body;

    const userInDb = await prisma.user.findUnique({
      where: { id: sessionUser.id },
    });

    if (!userInDb) {
      return NextResponse.json({ success: false, error: 'Kullanıcı bulunamadı.' }, { status: 404 });
    }

    const updateData: any = {};

    if (name && name.trim().length > 0) {
      updateData.name = name.trim();
    }

    if (phone !== undefined) {
      updateData.phone = phone.trim();
    }

    if (avatar !== undefined) {
      updateData.avatar = avatar;
    }

    // Password change flow
    if (newPassword && newPassword.trim().length > 0) {
      if (!currentPassword) {
        return NextResponse.json(
          { success: false, error: 'Şifrenizi değiştirmek için mevcut şifrenizi girmelisiniz.' },
          { status: 400 }
        );
      }

      const isCurrentValid = verifyPassword(currentPassword, userInDb.password);
      if (!isCurrentValid) {
        return NextResponse.json(
          { success: false, error: 'Mevcut şifreniz hatalı.' },
          { status: 400 }
        );
      }

      if (newPassword.trim().length < 6) {
        return NextResponse.json(
          { success: false, error: 'Yeni şifre en az 6 karakter olmalıdır.' },
          { status: 400 }
        );
      }

      updateData.password = hashPassword(newPassword.trim());
    }

    const updatedUser = await prisma.user.update({
      where: { id: sessionUser.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        target: true,
        phone: true,
        avatar: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Profiliniz başarıyla güncellendi.',
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Profil güncellenirken bir hata oluştu.' },
      { status: 500 }
    );
  }
}
