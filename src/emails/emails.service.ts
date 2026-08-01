import { Injectable } from '@nestjs/common';

import { EmailAttachment } from '../common/types/email.type';
import { Queue } from 'bullmq';
import { SendEmailJob } from './emails.processor';
import { InjectQueue } from '@nestjs/bullmq';

@Injectable()
export class EmailsService {
  constructor(
    @InjectQueue('send-email')
    private readonly sendEmailQueue: Queue<SendEmailJob>,
  ) {}
  private readonly WEBSITE_URL = 'www.congo-sphere.com';

  private welcomeEmailTemplate = (username: string): string => {
    return `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 20px rgba(0,0,0,0.05); text-align: center; padding: 40px 20px; position: relative; }
  .header { color: #4CAF50; font-size: 28px; font-weight: bold; margin-bottom: 20px; }
  h1 { color: #333; font-size: 24px; margin-bottom: 10px; }
  p { color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px; }
  .btn { display: inline-block; padding: 14px 32px; background-color: #FF5722; color: #ffffff !important; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; margin-top: 20px; box-shadow: 0 4px 10px rgba(255, 87, 34, 0.3); }
  .confetti-bg { position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.4; pointer-events: none; background-image: radial-gradient(#FFC107 15%, transparent 16%), radial-gradient(#E91E63 15%, transparent 16%), radial-gradient(#00BCD4 15%, transparent 16%), radial-gradient(#8BC34A 15%, transparent 16%); background-position: 10px 10px, 50px 40px, 90px 20px, 30px 80px; background-size: 120px 120px; }
  .content { position: relative; z-index: 1; margin-top: 20px;}
</style>
</head>
<body>
  <div class="container">
    <div class="confetti-bg"></div>
    <div class="header">🎉 Bienvenue sur Congo Sphere ! 🎉</div>
    <div class="content">
      <h1>Bonjour ${username},</h1>
      <p>Nous sommes absolument ravis de vous compter parmi nous ! Préparez-vous à explorer, échanger et profiter de tout ce que nous avons à offrir.</p>
      <a href="${this.WEBSITE_URL}" class="btn">Commencer maintenant</a>
    </div>
  </div>
</body>
</html>`;
  };

  private eventRegistrationEmailTemplate = (
    eventName: string,
    username: string,
    eventLink: string = '#',
  ): string => {
    return `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 20px rgba(0,0,0,0.05); text-align: center; padding: 40px 20px; position: relative; }
  .header { color: #4CAF50; font-size: 28px; font-weight: bold; margin-bottom: 20px; }
  h1 { color: #333; font-size: 24px; margin-bottom: 10px; }
  p { color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px; }
  .btn { display: inline-block; padding: 14px 32px; background-color: #FF5722; color: #ffffff !important; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; margin-top: 20px; box-shadow: 0 4px 10px rgba(255, 87, 34, 0.3); }
  .confetti-bg { position: absolute; top: 0; left: 0; right: 0; bottom: 0; opacity: 0.4; pointer-events: none; background-image: radial-gradient(#FFC107 15%, transparent 16%), radial-gradient(#E91E63 15%, transparent 16%), radial-gradient(#00BCD4 15%, transparent 16%), radial-gradient(#8BC34A 15%, transparent 16%); background-position: 10px 10px, 50px 40px, 90px 20px, 30px 80px; background-size: 120px 120px; }
  .content { position: relative; z-index: 1; margin-top: 20px;}
</style>
</head>
<body>
  <div class="container">
    <div class="confetti-bg"></div>
    <div class="header">🎊 Inscription Confirmée ! 🎊</div>
    <div class="content">
      <h1>Bonjour ${username},</h1>
      <p>Merci de vous être inscrit à l'événement <strong>${eventName}</strong>. Nous sommes impatients de vous y voir !</p>
      <a href="${eventLink}" class="btn">Voir l'événement</a>
    </div>
  </div>
</body>
</html>`;
  };

  private forgotPasswordEmailTemplate = (resetPasswordLink: string): string => {
    return `<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f9f9f9; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 20px rgba(0,0,0,0.05); text-align: center; padding: 40px 20px; position: relative; }
  .header { color: #FF5722; font-size: 28px; font-weight: bold; margin-bottom: 20px; }
  h1 { color: #333; font-size: 24px; margin-bottom: 10px; }
  p { color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 20px; }
  .btn { display: inline-block; padding: 14px 32px; background-color: #4CAF50; color: #ffffff !important; text-decoration: none; border-radius: 30px; font-weight: bold; font-size: 16px; margin-top: 20px; box-shadow: 0 4px 10px rgba(76, 175, 80, 0.3); }
  .content { position: relative; z-index: 1; margin-top: 20px;}
</style>
</head>
<body>
  <div class="container">
    <div class="header">🔒 Réinitialisation de mot de passe</div>
    <div class="content">
      <h1>Bonjour,</h1>
      <p>Vous avez demandé la réinitialisation de votre mot de passe pour votre compte Congo Sphere. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe. Ce lien expirera bientôt.</p>
      <a href="${resetPasswordLink}" class="btn">Réinitialiser le mot de passe</a>
      <p style="margin-top: 30px; font-size: 14px;">Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet e-mail en toute sécurité.</p>
    </div>
  </div>
</body>
</html>`;
  };

  async sendWelcomeEmail(to: string, username: string) {
    const subject = 'Bienvenue sur Congo Sphere !';
    const html = this.welcomeEmailTemplate(username);
    await this.sendEmailQueue.add('send-email', { to, subject, html });
  }

  async sendEventRegistrationEmail(
    to: string,
    eventName: string,
    username: string,
    eventId: string,
    attachments?: EmailAttachment[],
  ) {
    const subject = `Confirmation d'inscription à ${eventName}`;
    const html = this.eventRegistrationEmailTemplate(
      eventName,
      username,
      `${this.WEBSITE_URL}/events/${eventId}`,
    );
    await this.sendEmailQueue.add('send-email', {
      to,
      subject,
      html,
      attachments,
    });
  }

  async sendForgotPasswordEmail(accessToken: string, userEmail: string) {
    const subject = `Reset Password - Congo Sphere`;
    const html = this.forgotPasswordEmailTemplate(
      `${this.WEBSITE_URL}/forgot-password?token=${accessToken}`,
    );
    await this.sendEmailQueue.add('send-email', {
      to: userEmail,
      subject,
      html,
    });
  }
}
