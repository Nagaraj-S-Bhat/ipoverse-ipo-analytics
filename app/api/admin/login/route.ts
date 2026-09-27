import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AdminUserRepository } from '../../../../repositories/adminUserRepository';
import { comparePassword, signJWT } from '../../../../utils/authUtils';

const adminUserRepo = new AdminUserRepository();
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secure-secret-key-123';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validate inputs
    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Find admin user
    const user = await adminUserRepo.findByUsername(username);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Generate JWT (expires in 24 hours)
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };
    
    const token = await signJWT(tokenPayload, JWT_SECRET, 86400);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 86400, // 24 hours
    });

    // Update last login audit timestamp
    await adminUserRepo.updateLastLogin(user.id);

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[POST /api/admin/login] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
