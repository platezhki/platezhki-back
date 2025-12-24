import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = 'your-secret-key';
const JWT_REFRESH_SECRET = 'your-refresh-secret-key';

export interface JWTPayload {
  userId: number;
  username: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: number;
  tokenId: string;
  iat?: number;
  exp?: number;
}

export const generateAccessToken = (payload: Omit<JWTPayload, 'iat' | 'exp'>): string => {
  return jwt.sign(payload, JWT_SECRET);
};

export const generateRefreshToken = (userId: number): { token: string; tokenId: string } => {
  const tokenId = crypto.randomUUID();
  const payload: Omit<RefreshTokenPayload, 'iat' | 'exp'> = {
    userId,
    tokenId,
  };

  const token = jwt.sign(payload, JWT_REFRESH_SECRET);

  return { token, tokenId };
};

export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid access token');
  }
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as RefreshTokenPayload;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};

export const generateTokenPair = (user: { id: number; username: string }) => {
  const accessToken = generateAccessToken({
    userId: user.id,
    username: user.username,
  });

  const { token: refreshToken, tokenId } = generateRefreshToken(user.id);

  return {
    accessToken,
    refreshToken,
    tokenId,
  };
};
