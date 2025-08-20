import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all admin users
    const admins = await prisma.user.findMany({
      where: {
        role: 'ADMIN'
      },
      select: {
        id: true,
        email: true,
        role: true,
        username: true
      },
      orderBy: {
        email: 'asc'
      }
    });

    console.log(`[TEST-API] Found ${admins.length} admin accounts`);

    res.status(200).json({
      success: true,
      admins: admins,
      count: admins.length
    });

  } catch (error) {
    console.error('[TEST-API] Error fetching admin accounts:', error);
    res.status(500).json({
      error: 'Failed to fetch admin accounts',
      details: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}