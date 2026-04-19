import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface TicketEmailData {
  email: string;
  name: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  ticketId: string;
  ticketType: string;
  qrCode: string;
  orderId: string;
  amount: string;
}

export async function sendTicketEmail(data: TicketEmailData) {
  const { email, name, eventTitle, eventDate, eventLocation, ticketId, ticketType, qrCode, orderId, amount } = data;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <div style="background-color: #4f46e5; padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎫 Your Ticket</h1>
    </div>
    
    <div style="padding: 30px;">
      <p style="color: #374151; font-size: 16px;">Hi ${name},</p>
      <p style="color: #374151; font-size: 16px;">Thank you for your purchase! Your ticket for <strong>${eventTitle}</strong> is confirmed.</p>
      
      <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 18px;">Event Details</h3>
        <p style="margin: 8px 0; color: #374151;"><strong>Date:</strong> ${eventDate}</p>
        <p style="margin: 8px 0; color: #374151;"><strong>Location:</strong> ${eventLocation}</p>
        <p style="margin: 8px 0; color: #374151;"><strong>Ticket Type:</strong> ${ticketType}</p>
        <p style="margin: 8px 0; color: #374151;"><strong>Ticket ID:</strong> ${ticketId}</p>
        <p style="margin: 8px 0; color: #374151;"><strong>Order ID:</strong> ${orderId}</p>
        <p style="margin: 8px 0; color: #374151;"><strong>Amount Paid:</strong> ₦${amount}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">Scan this QR code at the event:</p>
        <img src="${qrCode}" alt="Ticket QR Code" style="width: 200px; height: 200px; border-radius: 8px;" />
      </div>
      
      <div style="background-color: #fef3c7; border-radius: 8px; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #92400e; font-size: 14px;"><strong>Important:</strong> Please save this email and bring either a printed or digital copy of your ticket QR code to the event.</p>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
        If you have any questions, please contact the event organizer.
      </p>
      
      <p style="color: #6b7280; font-size: 14px;">
        Best regards,<br>
        The Hitix Team
      </p>
    </div>
    
    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; color: #9ca3af; font-size: 12px;">
        © ${new Date().getFullYear()} Hitix - All rights reserved
      </p>
    </div>
  </div>
</body>
</html>
`;

  try {
    const result = await resend.emails.send({
      from: "Hitix <tickets@hitix.online>",
      to: email,
      subject: `🎫 Your Ticket for ${eventTitle}`,
      html: htmlContent,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}

export async function sendBulkTicketEmails(tickets: TicketEmailData[]) {
  const results = await Promise.allSettled(tickets.map(sendTicketEmail));
  return results;
}

export async function sendPasswordResetEmail(email: string, token: string, purpose: "reset-password" | "set-password" = "reset-password") {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const setPasswordUrl = `${baseUrl}/auth-route/reset-password?token=${token}`;

  let subject, title, buttonBg, buttonText;
  
  if (purpose === "set-password") {
    subject = "🔗 Complete Your Account Setup - Hitix";
    title = "🎉 Complete Your Account Setup";
    buttonBg = "#4f46e5";
    buttonText = "Set Password";
  } else {
    subject = "🔐 Reset Your Password - Hitix";
    title = "🔐 Reset Your Password";
    buttonBg = "#f43f5e";
    buttonText = "Reset Password";
  }

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <div style="background-color: ${buttonBg}; padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">${title}</h1>
    </div>
    
    <div style="padding: 30px;">
      <p style="color: #374151; font-size: 16px;">Hello,</p>
      ${purpose === "set-password" 
        ? `<p style="color: #374151; font-size: 16px;">Welcome to Hitix! Click the button below to set up your password and access your purchased tickets:</p>`
        : `<p style="color: #374151; font-size: 16px;">We received a request to reset your password. Click the button below to create a new password:</p>`
      }
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${setPasswordUrl}" style="display: inline-block; background-color: ${buttonBg}; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">${buttonText}</a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px;">This link will expire in ${purpose === "set-password" ? "24 hours" : "1 hour"}.</p>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
        If you didn't request this, please ignore this email.
      </p>
      
      <p style="color: #6b7280; font-size: 14px;">
        Best regards,<br>
        The Hitix Team
      </p>
    </div>
    
    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; color: #9ca3af; font-size: 12px;">
        © ${new Date().getFullYear()} Hitix - All rights reserved
      </p>
    </div>
  </div>
</body>
</html>
`;

  try {
    const result = await resend.emails.send({
      from: "Hitix <noreply@hitix.online>",
      to: email,
      subject: subject,
      html: htmlContent,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return { success: false, error };
  }
}

export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/verify-email?token=${token}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <div style="background-color: #22c55e; padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">✓ Verify Your Email</h1>
    </div>
    
    <div style="padding: 30px;">
      <p style="color: #374151; font-size: 16px;">Hello,</p>
      <p style="color: #374151; font-size: 16px;">Welcome to Hitix! Click the button below to verify your email address:</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verifyUrl}" style="display: inline-block; background-color: #22c55e; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Verify Email</a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px;">This link will expire in 24 hours.</p>
      
      <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
        If you didn't create an account on Hitix, please ignore this email.
      </p>
      
      <p style="color: #6b7280; font-size: 14px;">
        Best regards,<br>
        The Hitix Team
      </p>
    </div>
    
    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; color: #9ca3af; font-size: 12px;">
        © ${new Date().getFullYear()} Hitix - All rights reserved
      </p>
    </div>
  </div>
</body>
</html>
`;

  try {
    const result = await resend.emails.send({
      from: "Hitix <noreply@hitix.online>",
      to: email,
      subject: "✓ Verify Your Email - Hitix",
      html: htmlContent,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error sending verification email:", error);
    return { success: false, error };
  }
}