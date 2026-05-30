import { API_URL } from '../config';

/**
 * Check if the Express + Prisma server is up and reachable
 */
export async function checkPrismaReachable() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200); // 1.2s timeout
    
    const res = await fetch(`${API_URL}/health`, { 
      signal: controller.signal 
    });
    clearTimeout(timeoutId);
    
    if (res.ok) {
      const data = await res.json();
      return data.status === 'ok';
    }
  } catch (e) {
    // Silent fail if backend is not running
  }
  return false;
}

/**
 * Pull all state data from the Prisma Postgres backend
 */
export async function pullUserDataPrisma(userId = 'default') {
  const res = await fetch(`${API_URL}/api/userdata/${userId}`);
  if (!res.ok) throw new Error("Gagal mengambil data dari Prisma Postgres Server");
  return await res.json();
}

/**
 * Push/Upsert all state data to the Prisma Postgres backend
 */
export async function pushUserDataPrisma(state, userId = 'default') {
  const res = await fetch(`${API_URL}/api/userdata/${userId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state)
  });
  if (!res.ok) throw new Error("Gagal mensinkronisasikan data ke Prisma Postgres Server");
  return await res.json();
}
