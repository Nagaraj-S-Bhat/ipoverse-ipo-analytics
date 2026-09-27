import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AdminUserRepository } from '../../../../repositories/adminUserRepository';
import { verifyJWT } from '../../../../utils/authUtils';

const adminUserRepo = new AdminUserRepository();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secure-secret-key-123';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = await verifyJWT(token, JWT_SECRET);

    if (!payload || !payload.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await adminUserRepo.findById(payload.userId);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          lastLogin: user.lastLogin,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[GET /api/admin/me] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
