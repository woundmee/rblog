const FALLBACK_SITE_URL = "https://rblog.tech";

const withProtocol = (value: string): string => {
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  return `https://${value}`;
};

export const getSiteUrl = (): URL => {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.SITE_URL?.trim() || FALLBACK_SITE_URL;
  try {
    return new URL(withProtocol(raw));
  } catch {
    return new URL(FALLBACK_SITE_URL);
  }
};

export const toAbsoluteUrl = (pathname: string): string => new URL(pathname, getSiteUrl()).toString();
