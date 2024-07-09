import bcrypt from 'bcryptjs';

export async function verifyPassword(original: string, hashed: string): Promise<boolean> {
  return await bcrypt.compare(original, hashed);
}
