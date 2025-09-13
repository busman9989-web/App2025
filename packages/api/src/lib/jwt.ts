import jwt from 'jsonwebtoken';
import { FastifyReply, FastifyRequest } from 'fastify'; // Assuming you might use these for types

// This interface defines the payload structure for your JWT
// Based on your auth.routes.ts, the 'user' object has 'id', 'email', 'role'
export interface JWTUserPayload {
  id: string;
  email: string;
  role: string;
  // Add any other user-specific data you want in the token
}

// Load JWT Secret from environment variables
// Ensure JWT_SECRET is set in your .env file
const JWT_SECRET = process.env.JWT_SECRET || '4fc16bf68b5f33eb5b677b23a21840259ee9c5efea7f0c3157d7207271f36c07f43311ef3d0b5c1749d2b9ce101313c3d80d832035f958c3f6545acbbb46ea08your_development_secret_key'; // <-- Changed to JWT_SECRET

if (!JWT_SECRET || JWT_SECRET === 'your_development_secret_key') {
  console.warn("WARNING: JWT_SECRET is not set or using a default. This is insecure for production!");
  // You might want to throw an error here in production environments
}

// Function to generate a JWT token
// This signature matches how you're calling it: generateToken(user)
export function generateToken(payload: JWTUserPayload): string {
  // Sign the payload directly using jsonwebtoken
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }); // Token expires in 7 days
}

// Function to verify a JWT token
export async function verifyToken(token: string): Promise<JWTUserPayload | null> {
  try {
    // Verify the token directly using jsonwebtoken
    const decoded = jwt.verify(token, JWT_SECRET) as JWTUserPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error); // Use console.error for simplicity here
    return null;
  }
}

// You also need to ensure your src/index.ts is still registering @fastify/jwt
// with the same secret, as Fastify's preHandler might use it too.
// The authenticate preHandler in auth.routes.ts will also need this secret.
// Make sure your authenticate function (from ../lib/auth)
// uses fastify.jwt.verify() if it's integrated with the Fastify JWT plugin,
// or calls this verifyToken if it's handling verification manually.