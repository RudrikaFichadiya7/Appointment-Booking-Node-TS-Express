import { Request, Response, NextFunction } from 'express';
import bcrypt from "bcrypt";
import { User } from "../models/User";
export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ message: 'Unauthorized: Missing or invalid authorization header' });
  }

  // Extracting base64 encoded credentials from the auth header
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [email, password] = credentials.split(':');

  if (!email || !password) {
    return res.status(400).json({ message: 'Bad Request: Email and password are required in headers' });
  }
  const isValidUser = await validateUser(email, password);
  if (isValidUser) {
    // Authentication successful
    next();
  } else {
    // Authentication failed
    res.status(401).json({ message: 'Unauthorized: Invalid credentials' });
  }
};

const validateUser = async (email: string, password: string) => {
  const userVerify = await User.findOne({ email: email, role: 'admin', status:'active' }).exec();
  if (!userVerify) {
    return false;
  }
  const hashedPassword = userVerify.password;
  return await bcrypt.compare(password, hashedPassword);
}