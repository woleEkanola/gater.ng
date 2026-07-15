import { Resend } from "resend";
import { sendTicketWhatsApp } from "@/lib/whatsapp-messages";
import prisma from "@/lib/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);

interface TicketEmailData {
  email: string;
  name: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  eventBanner?: string | null;
  organizerName?: string | null;
  organizerImage?: string | null;
  ticketId: string;
  ticketType: string;
  qrCode: string;
  orderId: string;
  amount: string;
  discountCode?: string;
  phone?: string | null;
  eventId?: string;
  organizerId?: string;
}

function getQrCodeUrl(ticketId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://www.hitix.online";
  const qrData = encodeURIComponent(JSON.stringify({ ticketId }));
  return `${baseUrl}/api/qr?data=${qrData}`;
}

export async function sendTicketEmail(data: TicketEmailData) {
  const { email, name, eventTitle, eventDate, eventLocation, eventBanner, organizerName, organizerImage, ticketId, ticketType, orderId, amount, discountCode, phone, eventId, organizerId } = data;

  const qrCodeUrl = getQrCodeUrl(ticketId);
  const headerImage = eventBanner || "https://www.hitix.online/og-image.jpg";

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <div style="position: relative; height: 200px; overflow: hidden;">
      <img src="${headerImage}" alt="${eventTitle}" style="width: 100%; height: 100%; object-fit: cover;" />
      <div style="position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6));"></div>
      <div style="position: absolute; bottom: 20px; left: 30px; right: 30px;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">🎫 Your Ticket</h1>
        <p style="color: #ffffff; margin: 5px 0 0; font-size: 16px; opacity: 0.9;">${eventTitle}</p>
      </div>
    </div>

    <div style="padding: 30px;">
      <p style="color: #374151; font-size: 16px;">Hi ${name},</p>
      <p style="color: #374151; font-size: 16px;">Thank you for your purchase! Your ticket is confirmed.</p>

      <div style="text-align: center; margin: 30px 0; padding: 25px; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 12px; border: 2px solid #d1d5db;">
        <p style="margin: 0 0 8px; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Ticket Number</p>
        <p style="margin: 0; color: #111827; font-size: 36px; font-weight: 900; font-family: 'Courier New', monospace; letter-spacing: 2px;">${ticketId}</p>
      </div>

      <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="margin: 0 0 15px 0; color: #111827; font-size: 18px;">Event Details</h3>
        <p style="margin: 8px 0; color: #374151;"><strong>Date:</strong> ${eventDate}</p>
        <p style="margin: 8px 0; color: #374151;"><strong>Location:</strong> ${eventLocation}</p>
        <p style="margin: 8px 0; color: #374151;"><strong>Ticket Type:</strong> ${ticketType}</p>
        <p style="margin: 8px 0; color: #374151;"><strong>Order ID:</strong> ${orderId}</p>
        <p style="margin: 8px 0; color: #374151;"><strong>Amount Paid:</strong> ₦${amount}</p>
        ${discountCode ? `<p style="margin: 8px 0; color: #374151;"><strong>Promo Code Used:</strong> ${discountCode}</p>` : ''}
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 10px;">Scan this QR code at the event:</p>
        <img src="${qrCodeUrl}" alt="Ticket QR Code" style="width: 200px; height: 200px; border-radius: 8px; border: 2px solid #e5e7eb;" />
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

    ${organizerName ? `
    <div style="background-color: #f9fafb; padding: 20px; border-top: 1px solid #e5e7eb; display: flex; align-items: center; justify-content: center; gap: 12px;">
      ${organizerImage ? `<img src="${organizerImage}" alt="${organizerName}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" />` : ''}
      <p style="margin: 0; color: #374151; font-size: 14px;">Organized by <strong>${organizerName}</strong></p>
    </div>
    ` : ''}

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

    // Send WhatsApp message if phone and organizer info are available
    if (phone && organizerId) {
      console.log(`[Email] Triggering WhatsApp send for phone: ${phone}, organizerId: ${organizerId}`);
      sendTicketWhatsApp({
        phone,
        name,
        eventTitle,
        eventDate,
        eventLocation,
        ticketId,
        ticketType,
        orderId,
        amount,
        organizerId,
      }).then((waResult) => {
        console.log(`[Email] WhatsApp send completed:`, waResult);
      }).catch((err) => {
        console.error("[Email] WhatsApp send failed:", err);
      });
    }

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

export async function sendCheckinInvitationEmail(email: string, token: string, eventId: string, eventTitle: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://www.hitix.online";
  const acceptUrl = `${baseUrl}/checkin/accept?token=${token}&eventId=${eventId}`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <div style="background-color: #8b5cf6; padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎫 Check-in Invitation</h1>
    </div>

    <div style="padding: 30px;">
      <p style="color: #374151; font-size: 16px;">Hello,</p>
      <p style="color: #374151; font-size: 16px;">You've been invited to help check in attendees for <strong>${eventTitle}</strong>.</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${acceptUrl}" style="display: inline-block; background-color: #8b5cf6; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Accept Invitation</a>
      </div>

      <p style="color: #6b7280; font-size: 14px;">This invitation link expires in 7 days.</p>

      <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
        If you didn't expect this invitation, please ignore this email.
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
      subject: `🎫 You're invited to check in attendees for ${eventTitle}`,
      html: htmlContent,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error sending check-in invitation email:", error);
    return { success: false, error };
  }
}

export async function sendCheckinOtpEmail(email: string, otp: string) {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <div style="background-color: #8b5cf6; padding: 30px; text-align: center;">
      <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🔐 Verification Code</h1>
    </div>

    <div style="padding: 30px;">
      <p style="color: #374151; font-size: 16px;">Hello,</p>
      <p style="color: #374151; font-size: 16px;">Your verification code for check-in access is:</p>

      <div style="text-align: center; margin: 30px 0; padding: 25px; background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border-radius: 12px; border: 2px solid #d1d5db;">
        <p style="margin: 0; color: #111827; font-size: 48px; font-weight: 900; font-family: 'Courier New', monospace; letter-spacing: 8px;">${otp}</p>
      </div>

      <p style="color: #6b7280; font-size: 14px;">This code expires in 10 minutes.</p>

      <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
        If you didn't request this code, please ignore this email.
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
      subject: "🔐 Your check-in verification code",
      html: htmlContent,
    });

    return { success: true, data: result };
  } catch (error) {
    console.error("Error sending check-in OTP email:", error);
    return { success: false, error };
  }
}

interface OrganizerSaleEmailData {
  organizerEmail: string;
  organizerName: string;
  eventTitle: string;
  buyerName: string;
  buyerEmail: string;
  ticketType: string;
  quantity: number;
  amount: string;
}

export async function sendOrganizerSaleNotification(data: OrganizerSaleEmailData) {
  const {
    organizerEmail,
    organizerName,
    eventTitle,
    buyerName,
    buyerEmail,
    ticketType,
    quantity,
    amount,
  } = data;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
</head>
<body style="font-family: Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0;">
  <div style="max-width: 480px; margin: 0 auto; padding: 20px;">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: #e11d48; font-size: 24px; margin: 0;">Hitix</h1>
    </div>

    <div style="background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="color: #1f2937; font-size: 20px; margin: 0 0 16px 0;">
        🎟️ New Sale
      </h2>

      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        Hi ${organizerName},
      </p>

      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
        Someone just purchased tickets for <strong>${eventTitle}</strong>.
      </p>

      <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Buyer</td>
            <td style="padding: 6px 0; color: #1f2937; font-size: 14px; text-align: right;">${buyerName} (${buyerEmail})</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Ticket Type</td>
            <td style="padding: 6px 0; color: #1f2937; font-size: 14px; text-align: right;">${ticketType}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Quantity</td>
            <td style="padding: 6px 0; color: #1f2937; font-size: 14px; text-align: right;">${quantity}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #6b7280; font-size: 14px;">Amount</td>
            <td style="padding: 6px 0; color: #e11d48; font-size: 14px; font-weight: bold; text-align: right;">₦${amount}</td>
          </tr>
        </table>
      </div>

      <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px 0;">
        View your dashboard to see all sales and attendee details.
      </p>

      <div style="text-align: center;">
        <a href="https://hitix.online/dashboard" style="display: inline-block; background-color: #e11d48; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600;">
          View Dashboard
        </a>
      </div>
    </div>

    <div style="text-align: center; padding: 20px 0; color: #9ca3af; font-size: 12px;">
      <p style="margin: 0 0 8px 0;">
        This is an automated notification. Please do not reply to this email.
      </p>
      <p style="margin: 0;">
        © ${new Date().getFullYear()} Hitix - All rights reserved
      </p>
    </div>
  </div>
</body>
</html>
`;

  try {
    const result = await resend.emails.send({
      from: "Hitix <notifications@hitix.online>",
      to: organizerEmail,
      subject: `🎟️ New Sale — ${eventTitle}`,
      html: htmlContent,
    });

    console.log(`[Email] Organizer sale notification sent to ${organizerEmail}: ${result.data?.id || "OK"}`);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error sending organizer sale notification:", error);
    return { success: false, error };
  }
}
