import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

const isProduction = process.env.NODE_ENV === "production";

export const accessTokenCookie: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 15,
};

export const refreshTokenCookie: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};

export const userCookie: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};
