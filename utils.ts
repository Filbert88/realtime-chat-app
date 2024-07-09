import bcrypt from 'bcryptjs';

export async function verifyPassword(original: string, hashed: string): Promise<boolean> {
  return await bcrypt.compare(original, hashed);
}

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};