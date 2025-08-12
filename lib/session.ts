// lib/session.ts
import { getServerSession } from 'next-auth';
import { authOptions } from '../pages/api/auth/[...nextauth]';
import { NextApiRequest, NextApiResponse } from 'next';

export async function getSession(req?: NextApiRequest, res?: NextApiResponse) {
  const session = req && res ? await getServerSession(req, res, authOptions) : await getServerSession(authOptions);
  // console.log('🔍 [Custom Session] Session:', session);
  return session;
}