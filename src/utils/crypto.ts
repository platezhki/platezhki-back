import * as bcrypt from 'bcrypt';

async function hashPassword(password: string) {
  const saltRounds = 10;
  const hashed = await bcrypt.hash(password, saltRounds);
  return hashed;
}

async function comparePasswords(password: string, hash: string) {
  return await bcrypt.compare(password, hash);
}

export { hashPassword, comparePasswords };