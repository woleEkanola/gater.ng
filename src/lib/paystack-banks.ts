const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

export interface PaystackBank {
  name: string;
  code: string;
}

export async function fetchPaystackBanks(): Promise<PaystackBank[]> {
  try {
    const response = await fetch("https://api.paystack.co/bank", {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      console.error("Failed to fetch banks:", data.message);
      return [];
    }

    return data.data.map((bank: any) => ({
      name: bank.name,
      code: bank.code,
    }));
  } catch (error) {
    console.error("Error fetching Paystack banks:", error);
    return [];
  }
}
