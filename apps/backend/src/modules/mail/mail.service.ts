import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import type { MailConfig } from '@/config/mail.config';
import { PinoLogger } from 'nestjs-pino';
import { TemplateService } from './template.service';
import type { User } from '@/database/entities';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private fromName: string;
  private fromEmail: string;
  private origin: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
    private readonly templateService: TemplateService,
  ) {
    this.logger.setContext(MailService.name);
    const mailConfig = this.configService.get('mail') as MailConfig;
    this.fromName = mailConfig.from.name;
    this.fromEmail = mailConfig.from.email;
    this.origin = this.configService.get('origin') as string;
    this.transporter = nodemailer.createTransport({
      host: mailConfig.host,
      port: mailConfig.port,
      secure: mailConfig.secure,
      auth: mailConfig.auth.user ? mailConfig.auth : undefined,
    });
  }

  async sendPasswordResetEmail(user: User, token: string): Promise<void> {
    await this.logger.info(`Sending password reset email to: ${user.email}`);
    const resetUrl =
      `${this.origin}/auth/reset-password?token=${encodeURIComponent(token)}`;
    const variables = {
      resetUrl,
      title: 'Password Reset Request',
      headerIcon: '🔐',
      headerTitle: 'Password Reset Request',
      headerGradientStart: '#667eea',
      headerGradientEnd: '#764ba2',
      buttonColor: '#007bff',
      firstName: user.firstName || 'User',
      fromName: this.fromName,
      footerNote:
        'This is an automated message. Please do not reply to this email.',
    };

    const html = await this.templateService.renderTemplate(
      'password-reset.html',
      variables,
    );
    const text = await this.templateService.renderTemplate(
      'password-reset',
      variables,
    );

    const mailOptions = {
      from: `"${this.fromName}" <${this.fromEmail}>`,
      to: user.email,
      subject: 'Password Reset Request',
      html,
      text,
    };
    try {
      await this.transporter.sendMail(mailOptions);
      await this.logger.info(`Reset password email sent to: ${user.email}`);
    } catch (err) {
      await this.logger.error(
        `Failed to send reset password email to: ${user.email}`,
        err,
      );
    }
  }

  async sendInvitationEmail(user: User, token: string): Promise<void> {
    await this.logger.info(`Sending invitation email to: ${user.email}`);
    const inviteUrl =
      `${this.origin}/auth/reset-password?token=${encodeURIComponent(token)}`;
    const variables = {
      inviteUrl,
      title: 'You\'re Invited!',
      headerIcon: '🎉',
      headerTitle: 'Welcome!',
      headerGradientStart: '#28a745',
      headerGradientEnd: '#20c997',
      buttonColor: '#28a745',
      firstName: user.firstName || 'there',
      fromName: this.fromName,
      footerNote:
        'This invitation was sent to you by an administrator of our platform.',
    };

    const html = await this.templateService.renderTemplate(
      'invitation.html',
      variables,
    );
    const text = await this.templateService.renderTemplate(
      'invitation',
      variables,
    );

    const mailOptions = {
      from: `"${this.fromName}" <${this.fromEmail}>`,
      to: user.email,
      subject: 'You have been invited to join',
      html,
      text,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      await this.logger.info(`Invitation email sent to: ${user.email}`);
    } catch (error) {
      await this.logger.error(
        `Failed to send invitation email to: ${user.email}`,
        error,
      );
    }
  }
}
