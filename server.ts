import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDatabase } from './src/config/database.config';
import { verifySMTPConnection } from './src/utils/email.utils';

const PORT = process.env.PORT || 5002;

const startServer = async () => {
  try {
    await connectDatabase();
    
    // Verify SMTP connection (non-blocking)
    verifySMTPConnection().catch((error) => {
      console.warn('SMTP verification failed (email features may not work):', error.message);
    });
    
    app.listen(PORT, () => {
      console.log(`Server is running on port http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
