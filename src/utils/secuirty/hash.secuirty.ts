import { compare, hash } from "bcryptjs";

export const generateHash = async (
  plainText: string,
  saltRound: number = Number(process.env.SALT_ROUND) || 10
): Promise<string> => {
  return await hash(plainText, saltRound);
};

export const compareHash = async (
  plainText: string,
  hashedText: string
): Promise<boolean> => {
  return await compare(plainText, hashedText);
};