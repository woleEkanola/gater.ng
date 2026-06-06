import prisma from "@/lib/prisma";
import { sendTextMessage } from "@/lib/evolution-api";

interface TicketWhatsAppData {
  phone: string;
  name: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  ticketId: string;
  ticketType: string;
  orderId: string;
  amount: string;
  organizerId: string;
}

export function normalizePhone(phone: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("234")) return digits;
  if (digits.startsWith("0")) return "234" + digits.slice(1);
  if (digits.startsWith("2340")) return "234" + digits.slice(4);
  return digits;
}

export async function sendTicketWhatsApp(data: TicketWhatsAppData): Promise<boolean> {
  try {
    const organizer = await prisma.user.findUnique({
      where: { id: data.organizerId },
      select: { whatsappInstanceName: true, whatsappConnected: true },
    });

    if (!organizer?.whatsappConnected || !organizer?.whatsappInstanceName) {
      console.log(`[WhatsApp] Organizer ${data.organizerId} not connected or no instance`);
      return false;
    }

    const normalizedPhone = normalizePhone(data.phone);
    console.log(`[WhatsApp] Sending to ${data.phone} → normalized: ${normalizedPhone}`);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://www.hitix.online";
    const ticketUrl = `${appUrl}/tickets/${data.orderId}`;

    const text = [
      `🎫 *Ticket Confirmed!*`,
      ``,
      `*Event:* ${data.eventTitle}`,
      `*Date:* ${data.eventDate}`,
      `*Location:* ${data.eventLocation}`,
      `*Ticket Type:* ${data.ticketType}`,
      `*Ticket ID:* ${data.ticketId}`,
      `*Amount:* ₦${data.amount}`,
      ``,
      `View your ticket: ${ticketUrl}`,
      ``,
      `_Powered by Hitix_`,
    ].join("\n");

    const result = await sendTextMessage(organizer.whatsappInstanceName, normalizedPhone, text);
    console.log(`[WhatsApp] sendTextMessage result:`, result);
    return result.success;
  } catch (error) {
    console.error("Failed to send WhatsApp message:", error);
    return false;
  }
}

export async function sendCheckinInvitationWhatsApp(phone: string, eventTitle: string, acceptUrl: string, organizerId: string): Promise<boolean> {
  try {
    const organizer = await prisma.user.findUnique({
      where: { id: organizerId },
      select: { whatsappInstanceName: true, whatsappConnected: true },
    });

    if (!organizer?.whatsappConnected || !organizer?.whatsappInstanceName) {
      console.log(`[WhatsApp] Organizer ${organizerId} not connected or no instance for check-in invitation`);
      return false;
    }

    const normalizedPhone = normalizePhone(phone);
    console.log(`[WhatsApp] Sending check-in invitation to ${phone} → normalized: ${normalizedPhone}`);

    const text = [
      `🎫 *Check-in Staff Invitation*`,
      ``,
      `You've been invited to check in attendees for *${eventTitle}*.`,
      ``,
      `Click the link to get started:`,
      `${acceptUrl}`,
      ``,
      `_Powered by Hitix_`,
    ].join("\n");

    const result = await sendTextMessage(organizer.whatsappInstanceName, normalizedPhone, text);
    console.log(`[WhatsApp] Check-in invitation result:`, result);
    return result.success;
  } catch (error) {
    console.error("Failed to send check-in invitation WhatsApp:", error);
    return false;
  }
}

export async function sendCheckinOtpWhatsApp(phone: string, otp: string, organizerId: string): Promise<boolean> {
  try {
    const organizer = await prisma.user.findUnique({
      where: { id: organizerId },
      select: { whatsappInstanceName: true, whatsappConnected: true },
    });

    if (!organizer?.whatsappConnected || !organizer?.whatsappInstanceName) {
      console.log(`[WhatsApp] Organizer ${organizerId} not connected or no instance for check-in OTP`);
      return false;
    }

    const normalizedPhone = normalizePhone(phone);
    console.log(`[WhatsApp] Sending check-in OTP to ${phone} → normalized: ${normalizedPhone}`);

    const text = [
      `🔐 *Verification Code*`,
      ``,
      `Your check-in verification code is: *${otp}*`,
      ``,
      `This code expires in 10 minutes.`,
      ``,
      `_Powered by Hitix_`,
    ].join("\n");

    const result = await sendTextMessage(organizer.whatsappInstanceName, normalizedPhone, text);
    console.log(`[WhatsApp] Check-in OTP result:`, result);
    return result.success;
  } catch (error) {
    console.error("Failed to send check-in OTP WhatsApp:", error);
    return false;
  }
}
