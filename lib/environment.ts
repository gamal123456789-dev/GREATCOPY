// Environment detection utility
export const isLocalDevelopment = () => {
  return process.env.NODE_ENV === 'development' && 
         (process.env.NEXTAUTH_URL?.includes('localhost') || 
          process.env.NEXTAUTH_URL?.includes('127.0.0.1'));
};

export const isProduction = () => {
  return process.env.NODE_ENV === 'production' || 
         (!process.env.NEXTAUTH_URL?.includes('localhost') && 
          !process.env.NEXTAUTH_URL?.includes('127.0.0.1'));
};

export const getEnvironmentInfo = () => {
  const isLocal = isLocalDevelopment();
  return {
    isLocal,
    isProduction: !isLocal,
    baseUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    emailVerificationRequired: !isLocal,
    environment: isLocal ? 'development' : 'production'
  };
};
