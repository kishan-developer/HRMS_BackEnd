// Initialize Clerk client
let clerk: any = null;

try {
  if (process.env.CLERK_SECRET_KEY) {
    const clerkBackend = require('@clerk/backend');
    clerk = new clerkBackend.Clerk({
      secretKey: process.env.CLERK_SECRET_KEY,
    });
  }
} catch (error) {
  console.warn('Clerk client initialization failed:', error);
}

export const verifyClerkToken = async (token: string) => {
  try {
    if (!clerk) {
      console.warn('Clerk client not initialized');
      return null;
    }
    const payload = await clerk.verifyToken(token);
    return payload;
  } catch (error) {
    console.error('Clerk token verification failed:', error);
    return null;
  }
};
