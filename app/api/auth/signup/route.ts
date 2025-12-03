import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting signup process...');
    await dbConnect();
    console.log('Database connected');

    let body: any;
    try {
      body = await request.json();
    } catch (err) {
      console.error('Failed to parse request body:', err);
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { username, email, password: userPassword } = body || {};

    console.log('Signup request body:', { username, email, hasPassword: !!userPassword });

    if (!username || !email || !userPassword) {
      return NextResponse.json(
        { error: 'Username, email, and password are required' },
        { status: 400 }
      );
    }

    if (userPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    console.log('Checking for existing user...');
    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      console.log('User already exists:', existingUser.email);
      return NextResponse.json(
        { error: 'User with this email or username already exists' },
        { status: 400 }
      );
    }

    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(userPassword, 12);

    console.log('Creating new user...');
    const user = new User({
      username,
      email,
      password: hashedPassword,
    });

    console.log('Saving user...');
    await user.save();

    console.log('User saved successfully:', user._id);


    const userObject = user.toObject();
    delete userObject.password;

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: userObject,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}