import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, hashPassword } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET all users (with role and target info)
export async function GET() {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser) {
      return NextResponse.json({ success: false, error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        target: true,
        phone: true,
        avatar: true,
        createdAt: true,
        _count: {
          select: {
            clients: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Kullanıcılar alınamadı.' },
      { status: 500 }
    );
  }
}

// POST: Create a new user (Only ADMIN / SUPER_ADMIN)
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Bu işlem için Marka Merkezi yetkisi gereklidir.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, email, password, role, target, phone } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { success: false, error: 'Ad Soyad, E-posta, Şifre ve Rol alanları zorunludur.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Bu e-posta adresi ile kayıtlı bir kullanıcı zaten var.' },
        { status: 400 }
      );
    }

    const hashedPassword = hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: role || 'SALES_REP',
        target: role === 'VIEWER' ? 0 : (Number(target) || 500000),
        phone: phone || '',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        target: true,
        phone: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Kullanıcı oluşturulamadı.' },
      { status: 500 }
    );
  }
}

// PUT: Update user (Only ADMIN / SUPER_ADMIN)
export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Bu işlem için Marka Merkezi yetkisi gereklidir.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, name, email, password, role, target, phone } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı ID gereklidir.' },
        { status: 400 }
      );
    }

    const updateData: any = {
      ...(name ? { name: name.trim() } : {}),
      ...(email ? { email: email.trim().toLowerCase() } : {}),
      ...(role ? { role } : {}),
      ...(role === 'VIEWER' ? { target: 0 } : target !== undefined ? { target: Number(target) } : {}),
      ...(phone !== undefined ? { phone } : {}),
    };

    if (password && password.trim().length > 0) {
      updateData.password = hashPassword(password);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        target: true,
        phone: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Kullanıcı güncellenemedi.' },
      { status: 500 }
    );
  }
}

// DELETE: Delete user (Only ADMIN / SUPER_ADMIN)
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getSessionUser();
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { success: false, error: 'Bu işlem için Marka Merkezi yetkisi gereklidir.' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Kullanıcı ID gereklidir.' },
        { status: 400 }
      );
    }

    if (userId === currentUser.id) {
      return NextResponse.json(
        { success: false, error: 'Kendi hesabınızı silemezsiniz.' },
        { status: 400 }
      );
    }

    // Reassign or check if user has clients
    const clientCount = await prisma.client.count({
      where: { satis_temsilcisi_id: userId },
    });

    if (clientCount > 0) {
      // Reassign to current admin before delete or inform user
      await prisma.client.updateMany({
        where: { satis_temsilcisi_id: userId },
        data: { satis_temsilcisi_id: currentUser.id },
      });
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ success: true, message: 'Kullanıcı silindi ve portföyü aktarıldı.' });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Kullanıcı silinemedi.' },
      { status: 500 }
    );
  }
}
