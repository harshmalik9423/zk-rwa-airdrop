import { NextResponse } from 'next/server';
import prisma from '@/prisma/prismaClient';

export async function POST(request: Request) {
  try {
    const { walletAddress } = await request.json();

    // First, find the user registry entry to get the userId
    const userRegistry = await prisma.userRegistry.findFirst({
      where: {
        walletaddress: walletAddress,
        isactive: true,
      },
    });

    if (!userRegistry) {
      return NextResponse.json(
        { error: 'No active user found for this wallet address' },
        { status: 404 }
      );
    }

    // Then, get all holdings for this userId
    const holdings = await prisma.userHolding.findMany({
      where: {
        userid: userRegistry.userid,
      },
      select: {
        holding: true,
        noofshares: true,
        lastholdingtime: true,
      },
    });

    // Transform the data to match the frontend's expected format
    const formattedHoldings = holdings.map((holding) => ({
      symbol: holding.holding,
      noOfShares: holding.noofshares,
      lastHoldingTime: holding.lastholdingtime.toISOString(),
    }));

    return NextResponse.json({ holdings: formattedHoldings });
  } catch (error) {
    console.error('Error fetching holdings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch holdings' },
      { status: 500 }
    );
  }
}
