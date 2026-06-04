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

export async function sendTicketWhatsApp(data: TicketWhatsAppData): Promise<boolean> {
  try {
    const organizer = await prisma.user.findUnique({
      where: { id: data.organizerId },
      select: { whatsappInstanceName: true, whatsappConnected: true },
    });

    if (!organizer?.whatsappConnected || !organizer?.whatsappInstanceName) {
      return false;
    }

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

    const result = await sendTextMessage(organizer.whatsappInstanceName, data.phone, text);
    return result.success;
  } catch (error) {
    console.error("Failed to send WhatsApp message:", error);
    return false;
  }
}
