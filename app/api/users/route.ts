import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';


export async function GET(request: NextRequest) {
  try {
    const tokenUser = getUserFromRequest(request);
    
    if (!tokenUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const all = searchParams.get('all');

    if (all === 'true') {
      const users = await User.find({ _id: { $ne: tokenUser.userId } })
        .select('-password')
        .sort({ isOnline: -1, lastSeen: -1 });

      return NextResponse.json({ users });
    }

    const user = await User.findById(tokenUser.userId).select('-password');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const tokenUser = getUserFromRequest(request);
    
    if (!tokenUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await dbConnect();

    const { isOnline } = await request.json();

    const user = await User.findByIdAndUpdate(
      tokenUser.userId,
      { 
        isOnline, 
        lastSeen: new Date() 
      },
      { new: true }
    ).select('-password');

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
