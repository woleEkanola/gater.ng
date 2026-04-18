import prisma from "@/lib/prisma";

export async function hasPayoutSettings(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      payoutBankCode: true,
      payoutAccountNumber: true,
      payoutAccountName: true,
    },
  });

  return !!(
    user?.payoutBankCode &&
    user?.payoutAccountNumber &&
    user?.payoutAccountName
  );
}

export async function getOrganizerPayoutSettings(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      payoutBankCode: true,
      payoutAccountNumber: true,
      payoutAccountName: true,
      transactionFeePercent: true,
    },
  });
}

export function hasValidPayoutSettings(user: {
  payoutBankCode?: string | null;
  payoutAccountNumber?: string | null;
  payoutAccountName?: string | null;
}): boolean {
  return !!(
    user.payoutBankCode &&
    user.payoutAccountNumber &&
    user.payoutAccountName
  );
}