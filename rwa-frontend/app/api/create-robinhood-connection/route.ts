import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { userId, walletAddress } = await request.json();

    // Check if an entry already exists
    const existingRegistry = await prisma.userRegistry.findFirst({
      where: {
        userid: userId,
        walletaddress: walletAddress,
      },
    });

    if (existingRegistry) {
      // Update existing entry
      const updatedRegistry = await prisma.userRegistry.update({
        where: {
          id: existingRegistry.id,
        },
        data: {
          isactive: true,
          updatedat: new Date(),
        },
      });

      return NextResponse.json(updatedRegistry);
    } else {
      // Create new entry
      const newRegistry = await prisma.userRegistry.create({
        data: {
          id: randomUUID().toString(),
          userid: userId,
          walletaddress: walletAddress,
          isactive: true,
        },
      });

      return NextResponse.json(newRegistry);
    }
  } catch (error) {
    console.error('Error registering Robinhood connection:', error);
    return NextResponse.json(
      { error: 'Failed to register Robinhood connection' },
      { status: 500 }
    );
  }
}
