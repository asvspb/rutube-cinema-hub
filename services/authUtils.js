import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const DEFAULT_BCRYPT_ROUNDS = 10;

export const hashPassword = async (password, rounds = DEFAULT_BCRYPT_ROUNDS) => {
  return bcrypt.hash(password, rounds);
};

export const verifyPassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

export const createAccessToken = ({
  userId,
  sessionId,
  secret,
  issuer,
  expiresIn,
}) => {
  return jwt.sign(
    {
      sid: sessionId,
    },
    secret,
    {
      subject: userId,
      issuer,
      expiresIn,
    }
  );
};

export const verifyAccessToken = (token, { secret, issuer }) => {
  try {
    return jwt.verify(token, secret, { issuer });
  } catch {
    return null;
  }
};

