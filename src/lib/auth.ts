import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "trendy-store-secret-key-change-in-production";

export interface AuthPayload {
  id: string;
  username: string;
  name: string;
  role: "admin" | "worker";
}

export function signToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<AuthPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAdmin(): Promise<AuthPayload> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
  return session;
}
