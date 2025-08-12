const fs = require('fs');
const path = require('path');

console.log('🔄 Restoring Email Verification for Production...');

try {
  // Restore register.ts
  const registerBackup = fs.readFileSync(path.join(__dirname, 'backups', 'register.ts.backup'), 'utf8');
  fs.writeFileSync(path.join(__dirname, 'pages', 'api', 'register.ts'), registerBackup);
  console.log('✅ Restored register.ts');
  
  // Restore NextAuth config
  const nextAuthBackup = fs.readFileSync(path.join(__dirname, 'backups', '[...nextauth].ts.backup'), 'utf8');
  fs.writeFileSync(path.join(__dirname, 'pages', 'api', 'auth', '[...nextauth].ts'), nextAuthBackup);
  console.log('✅ Restored NextAuth config');
  
  console.log('
🎉 Email verification has been restored!');
  console.log('📝 Remember to restart your development server.');
} catch (error) {
  console.error('❌ Error restoring files:', error.message);
}
