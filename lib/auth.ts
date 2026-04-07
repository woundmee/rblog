import crypto from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "rblog_admin_session";

const getAdminUsername = () => process.env.ADMIN_USERNAME ?? "admin";
const getAdminPassword = () => process.env.ADMIN_PASSWORD ?? "change-me";
const getAdminSecret = () => process.env.ADMIN_SECRET ?? "local-dev-secret";

const toBase64Url = (value: string): string => Buffer.from(value).toString("base64url");

const sign = (payload: string): string =>
  crypto.createHmac("sha256", getAdminSecret()).update(payload).digest("base64url");

export const isValidAdminCredentials = (username: string, password: string): boolean =>
  username === getAdminUsername() && password === getAdminPassword();

export const createAdminToken = (): string => {
  const body = JSON.stringify({
    sub: getAdminUsername(),
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7
  });
  const payload = toBase64Url(body);
  const signature = sign(payload);
  return `${payload}.${signature}`;
};

export const verifyAdminToken = (token: string): boolean => {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) {
    return false;
  }

  const expected = sign(payload);
  if (signature !== expected) {
    return false;
  }

  try {
    const decoded = Buffer.from(payload, "base64url").toString("utf8");
    const body = JSON.parse(decoded) as { sub?: string; exp?: number };
    if (body.sub !== getAdminUsername()) {
      return false;
    }
    if (!body.exp || Date.now() > body.exp) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
};

export const isAdminRequest = async (): Promise<boolean> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) {
    return false;
  }
  return verifyAdminToken(token);
};
