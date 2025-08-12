import nodemailer from 'nodemailer';

export default async function sendVerificationEmail(email: string, token: string, isPasswordReset: boolean = false) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://gear-score.com';
  const link = isPasswordReset 
    ? `${baseUrl}/reset-password?token=${token}`
    : `${baseUrl}/verify?token=${token}`;

  console.log(`📨 Sending ${isPasswordReset ? 'password reset' : 'verification'} email to:`, email, 'Token:', token);

  const transporter = nodemailer.createTransport({
    host: 'smtp.hostinger.com',
    port: 465,
    secure: true, // Use SSL for port 465
    auth: {
      user: process.env.EMAIL_USER, // support@gear-score.com
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false // Allow self-signed certificates for VPS
    },
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000, // 30 seconds
    socketTimeout: 60000, // 60 seconds
  });

  const mailOptions = isPasswordReset ? {
    from: `Gearscore <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Reset your Gearscore password',
    html: `
      <h2>Password Reset Request 🔐</h2>
      <p>You requested to reset your password. Click the link below to set a new password:</p>
      <a href="${link}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
      <br /><br />
      <p>If you didn't request this, please ignore this email.</p>
      <small>This link will expire in 1 hour.</small>
    `,
  } : {
     from: `Gearscore <${process.env.EMAIL_USER}>`,
     to: email,
     subject: 'Verify your Gearscore account',
     html: `
       <h2>Welcome to Gearscore 👋</h2>
       <p>Please confirm your email by clicking the link below:</p>
       <a href="${link}">${link}</a>
       <br /><br />
       <small>This link will expire soon.</small>
     `,
   };

  try {
    // Test SMTP connection first
    console.log('🔍 Testing SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');
    
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent to', email, '| Response:', info.response);
    console.log('📧 Message ID:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    console.error('📧 Email config:', {
      user: process.env.EMAIL_USER,
      passLength: process.env.EMAIL_PASS?.length || 0,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL
    });
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('Invalid login')) {
        throw new Error('Email authentication failed. Please check your Gmail app password.');
      } else if (error.message.includes('ECONNREFUSED')) {
        throw new Error('Cannot connect to Gmail SMTP server. Check your internet connection.');
      } else if (error.message.includes('ETIMEDOUT')) {
        throw new Error('Email sending timed out. This may be due to VPS network restrictions.');
      }
    }
    
    throw new Error('Failed to send verification email: ' + (error as Error).message);
  }
}