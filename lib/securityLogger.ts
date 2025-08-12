// Security Logger - Comprehensive security logging system
// Comprehensive security logging system for monitoring and alerting

import fs from 'fs';
import path from 'path';

interface SecurityEvent {
  timestamp: string;
  level: 'INFO' | 'WARNING' | 'CRITICAL';
  category: 'AUTH' | 'ACCESS' | 'INPUT' | 'RATE_LIMIT' | 'SYSTEM';
  event: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  details?: any;
}

class SecurityLogger {
  private logDir: string;
  private maxLogSize: number = 10 * 1024 * 1024; // 10MB
  private maxLogFiles: number = 5;

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs', 'security');
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    try {
      if (!fs.existsSync(this.logDir)) {
        fs.mkdirSync(this.logDir, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to create security log directory:', error);
    }
  }

  private getLogFileName(): string {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `security-${date}.log`);
  }

  private rotateLogIfNeeded(): void {
    try {
      const logFile = this.getLogFileName();
      if (fs.existsSync(logFile)) {
        const stats = fs.statSync(logFile);
        if (stats.size > this.maxLogSize) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const rotatedFile = logFile.replace('.log', `-${timestamp}.log`);
          // Use copyFile + unlink instead of rename to avoid EBUSY errors on Windows
          fs.copyFileSync(logFile, rotatedFile);
          fs.unlinkSync(logFile);
          this.cleanOldLogs();
        }
      }
    } catch (error) {
      console.error('Failed to rotate security log:', error);
    }
  }

  private cleanOldLogs(): void {
    try {
      const files = fs.readdirSync(this.logDir)
        .filter(file => file.startsWith('security-') && file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(this.logDir, file),
          mtime: fs.statSync(path.join(this.logDir, file)).mtime
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      if (files.length > this.maxLogFiles) {
        files.slice(this.maxLogFiles).forEach(file => {
          fs.unlinkSync(file.path);
        });
      }
    } catch (error) {
      console.error('Failed to clean old security logs:', error);
    }
  }

  public log(event: Omit<SecurityEvent, 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date().toISOString()
    };

    // Console logging
    const logMessage = this.formatLogMessage(securityEvent);
    console.log(logMessage);

    // File logging
    try {
      this.rotateLogIfNeeded();
      const logFile = this.getLogFileName();
      fs.appendFileSync(logFile, logMessage + '\n');
    } catch (error) {
      console.error('Failed to write to security log file:', error);
    }

    // Critical events should trigger alerts
    if (event.level === 'CRITICAL') {
      this.handleCriticalEvent(securityEvent);
    }
  }

  private formatLogMessage(event: SecurityEvent): string {
    const parts = [
      `[${event.timestamp}]`,
      `[${event.level}]`,
      `[${event.category}]`,
      event.event
    ];

    if (event.userId) parts.push(`User: ${event.userId}`);
    if (event.ip) parts.push(`IP: ${event.ip}`);
    if (event.details) parts.push(`Details: ${JSON.stringify(event.details)}`);

    return parts.join(' | ');
  }

  private handleCriticalEvent(event: SecurityEvent): void {
    // في بيئة الإنتاج، يمكن إرسال تنبيهات عبر البريد الإلكتروني أو Slack
    console.error('🚨 CRITICAL SECURITY EVENT:', event);
    
    // يمكن إضافة المزيد من آليات التنبيه هنا:
    // - إرسال بريد إلكتروني للمدراء
    // - إرسال تنبيه لـ Slack
    // - تسجيل في نظام مراقبة خارجي
  }

  // دوال مساعدة للأحداث الشائعة
  public logFailedLogin(email: string, ip: string, userAgent?: string): void {
    this.log({
      level: 'WARNING',
      category: 'AUTH',
      event: 'Failed login attempt',
      ip,
      userAgent,
      details: { email }
    });
  }

  public logSuccessfulLogin(userId: string, ip: string, userAgent?: string): void {
    this.log({
      level: 'INFO',
      category: 'AUTH',
      event: 'Successful login',
      userId,
      ip,
      userAgent
    });
  }

  public logRateLimitExceeded(identifier: string, endpoint: string, ip?: string): void {
    this.log({
      level: 'WARNING',
      category: 'RATE_LIMIT',
      event: 'Rate limit exceeded',
      ip,
      details: { identifier, endpoint }
    });
  }

  public logUnauthorizedAccess(userId: string | undefined, resource: string, ip: string): void {
    this.log({
      level: 'CRITICAL',
      category: 'ACCESS',
      event: 'Unauthorized access attempt',
      userId,
      ip,
      details: { resource }
    });
  }

  public logSuspiciousActivity(description: string, userId?: string, ip?: string, details?: any): void {
    this.log({
      level: 'CRITICAL',
      category: 'SYSTEM',
      event: 'Suspicious activity detected',
      userId,
      ip,
      details: { description, ...details }
    });
  }

  public logInputValidationFailure(field: string, value: any, userId?: string, ip?: string): void {
    this.log({
      level: 'WARNING',
      category: 'INPUT',
      event: 'Input validation failure',
      userId,
      ip,
      details: { field, value: typeof value === 'string' ? value.substring(0, 100) : value }
    });
  }

  public logAdminAction(action: string, userId: string, ip: string, details?: any): void {
    this.log({
      level: 'INFO',
      category: 'ACCESS',
      event: `Admin action: ${action}`,
      userId,
      ip,
      details
    });
  }
}

// إنشاء مثيل واحد للاستخدام في جميع أنحاء التطبيق
export const securityLogger = new SecurityLogger();

// دالة مساعدة للحصول على معلومات الطلب
export function getRequestInfo(req: any): { ip: string; userAgent?: string } {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0].trim() : 
    req.connection?.remoteAddress || 
    req.socket?.remoteAddress || 
    req.ip || 
    'unknown';
  
  const userAgent = req.headers['user-agent'];
  
  return { ip, userAgent };
}

export default SecurityLogger;