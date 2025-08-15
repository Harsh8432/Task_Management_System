import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env['SMTP_HOST'] || 'smtp.gmail.com',
      port: parseInt(process.env['SMTP_PORT'] || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env['SMTP_USER'] || '',
        pass: process.env['SMTP_PASS'] || ''
      }
    });
  }

  public async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env['SMTP_FROM'] || process.env['SMTP_USER'],
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.htmlToText(options.html)
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info('Email sent successfully', {
        messageId: info.messageId,
        to: options.to,
        subject: options.subject
      });

      return true;
    } catch (error) {
      logger.error('Failed to send email', {
        error: error instanceof Error ? error.message : 'Unknown error',
        to: options.to,
        subject: options.subject
      });
      return false;
    }
  }

  public async sendVerificationEmail(email: string, token: string): Promise<boolean> {
    const verificationUrl = `${process.env['FRONTEND_URL'] || 'http://localhost:3000'}/verify-email?token=${token}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Verify Your Email Address</h2>
        <p>Thank you for registering! Please click the button below to verify your email address:</p>
        <a href="${verificationUrl}" style="display: inline-block; background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">Verify Email</a>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Verify Your Email Address',
      html
    });
  }

  public async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    const resetUrl = `${process.env['FRONTEND_URL'] || 'http://localhost:3000'}/reset-password?token=${token}`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Reset Your Password</h2>
        <p>You requested a password reset. Please click the button below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 20px 0;">Reset Password</a>
        <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Reset Your Password',
      html
    });
  }

  public async sendWelcomeEmail(email: string, firstName: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Task Management!</h2>
        <p>Hi ${firstName},</p>
        <p>Welcome to our task management platform! We're excited to have you on board.</p>
        <p>Here are some things you can do to get started:</p>
        <ul>
          <li>Complete your profile</li>
          <li>Create your first task</li>
          <li>Invite team members</li>
          <li>Explore the dashboard</li>
        </ul>
        <p>If you have any questions, feel free to reach out to our support team.</p>
        <p>Happy task managing!</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Welcome to Task Management!',
      html
    });
  }

  public async sendTaskAssignmentEmail(email: string, firstName: string, taskTitle: string, assignerName: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">New Task Assignment</h2>
        <p>Hi ${firstName},</p>
        <p>You have been assigned a new task: <strong>${taskTitle}</strong></p>
        <p>Assigned by: ${assignerName}</p>
        <p>Please log in to your dashboard to view the task details and get started.</p>
        <p>If you have any questions about this task, please contact the assigner.</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'New Task Assignment',
      html
    });
  }

  public async sendTaskDueReminder(email: string, firstName: string, taskTitle: string, dueDate: Date): Promise<boolean> {
    const formattedDate = dueDate.toLocaleDateString();
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ffc107;">Task Due Reminder</h2>
        <p>Hi ${firstName},</p>
        <p>This is a friendly reminder that your task <strong>${taskTitle}</strong> is due on ${formattedDate}.</p>
        <p>Please make sure to complete it on time or update the due date if needed.</p>
        <p>Log in to your dashboard to view and update the task.</p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: 'Task Due Reminder',
      html
    });
  }

  private htmlToText(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/&quot;/g, '"') // Replace &quot; with "
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }

  public async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('Email service connection verified');
      return true;
    } catch (error) {
      logger.error('Email service connection failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new EmailService();
