import { NextResponse } from 'next/server';
import prisma from '@/prisma/prismaClient';

export async function POST(request: Request) {
  try {
    const { walletAddress } = await request.json();

    const userRegistry = await prisma.userRegistry.findFirst({
      where: {
        walletaddress: walletAddress,
      },
    });

    return NextResponse.json({
      isActive: userRegistry?.isactive ?? false,
    });
  } catch (error) {
    console.error('Error checking Robinhood connection:', error);
    return NextResponse.json(
      {
        isActive: false,
      },
      {
        status: 500,
      }
    );
  }
}
