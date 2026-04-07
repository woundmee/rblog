import crypto from "node:crypto";

export const VISITOR_COOKIE_NAME = "rblog_vid";

export const createVisitorId = (): string => crypto.randomUUID().replaceAll("-", "");
