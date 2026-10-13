import { getDb } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export interface UserRecord {
  id: number;
  uid: string;
  email: string;
  name: string | null;
  role: string | null;
  createdAt: Date | null;
}

// In-memory mock store for users when Cloud SQL is not connected
const mockUsersStore: Map<string, UserRecord> = new Map([
  [
    'default-manager',
    {
      id: 1,
      uid: 'default-manager',
      email: 'sunnybank@malayacorner.com.au',
      name: 'Manager Mark Zhang',
      role: 'manager',
      createdAt: new Date(),
    },
  ],
]);
let mockIdCounter = 2;

export async function getOrCreateUser(uid: string, email: string, name?: string): Promise<UserRecord> {
  try {
    const db = getDb();
    if (db) {
      const result = await db.insert(users)
        .values({
          uid,
          email,
          name: name || null,
        })
        .onConflictDoUpdate({
          target: users.uid,
          set: {
            email,
            ...(name ? { name } : {}),
          },
        })
        .returning();

      if (result && result.length > 0) {
        return result[0];
      }
    }
  } catch (error) {
    console.warn('[AI Studio] Database query failed in getOrCreateUser, using mock store:', error);
  }

  // Fallback in-memory
  let user = mockUsersStore.get(uid);
  if (!user) {
    user = {
      id: mockIdCounter++,
      uid,
      email,
      name: name || null,
      role: 'staff',
      createdAt: new Date(),
    };
    mockUsersStore.set(uid, user);
  } else {
    user.email = email;
    if (name) user.name = name;
  }
  return user;
}

export async function getUsers(): Promise<UserRecord[]> {
  try {
    const db = getDb();
    if (db) {
      return await db.select().from(users);
    }
  } catch (error) {
    console.warn('[AI Studio] Database query failed in getUsers, using mock store:', error);
  }
  return Array.from(mockUsersStore.values());
}

export async function getUserByUid(uid: string): Promise<UserRecord | null> {
  try {
    const db = getDb();
    if (db) {
      const results = await db.select().from(users).where(eq(users.uid, uid));
      return results[0] || null;
    }
  } catch (error) {
    console.warn('[AI Studio] Database query failed in getUserByUid, using mock store:', error);
  }
  return mockUsersStore.get(uid) || null;
}
