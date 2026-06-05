const API_URL = process.env.EVOLUTION_API_URL || "";
const API_KEY = process.env.EVOLUTION_API_KEY || "";

function headers() {
  return {
    "Content-Type": "application/json",
    apikey: API_KEY,
  };
}

function checkConfig() {
  if (!API_URL || !API_KEY) {
    throw new Error("Evolution API not configured. Set EVOLUTION_API_URL and EVOLUTION_API_KEY.");
  }
}

export interface EvolutionInstance {
  instanceName: string;
  owner?: string;
  profileName?: string;
  profilePictureUrl?: string;
  profileStatus?: string;
  status?: string;
  serverUrl?: string;
  state?: string;
}

export async function createInstance(instanceName: string): Promise<{ success: boolean; error?: string }> {
  checkConfig();
  try {
    const res = await fetch(`${API_URL}/instance/create`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ instanceName, token: instanceName, qrcode: true, integration: "WHATSAPP-BAILEYS" }),
    });
    const body = await res.text();
    if (!res.ok) {
      console.error(`[Evolution API] createInstance failed: HTTP ${res.status}`, body);
      let errMsg = `HTTP ${res.status}`;
      try {
        const data = JSON.parse(body);
        errMsg = data.error || data.message || data.response?.message || errMsg;
      } catch {}
      return { success: false, error: errMsg };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getQRCode(instanceName: string): Promise<{
  success: boolean;
  qrcode?: string;
  code?: string;
  state?: string;
  error?: string;
}> {
  checkConfig();
  try {
    const res = await fetch(`${API_URL}/instance/connect/${instanceName}`, {
      method: "GET",
      headers: headers(),
    });
    const data = await res.json();
    console.log(`[Evolution API] getQRCode response for ${instanceName}:`, JSON.stringify(data));

    if (!res.ok) {
      const err = data.error || data.message || `HTTP ${res.status}`;
      return { success: false, error: err };
    }

    const state = data.instance?.state || data.state;
    if (state === "open" || state === "connected") {
      return { success: true, state: "connected" };
    }

    let rawBase64 = data.qrcode?.base64 || data.qrcode || data.base64;
    if (typeof rawBase64 === "string" && rawBase64.startsWith("data:")) {
      rawBase64 = rawBase64.replace(/^data:image\/[^;]+;base64,/, "");
    }

    const code = data.code || data.qrcode?.code || data.pairingCode;

    if (!rawBase64 && !code) {
      console.warn(`[Evolution API] getQRCode: no QR data in response for ${instanceName}`, data);
      return { success: false, error: "No QR code in response" };
    }

    return { success: true, qrcode: rawBase64, code, state: state || "connecting" };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getConnectionState(instanceName: string): Promise<{
  success: boolean;
  connected?: boolean;
  phone?: string;
  state?: string;
  error?: string;
}> {
  checkConfig();
  try {
    const res = await fetch(`${API_URL}/instance/connectionState/${instanceName}`, {
      method: "GET",
      headers: headers(),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || "Failed to check connection" };
    }
    const state = data.instance?.state || data.state || "disconnected";
    const connected = state === "open" || state === "connected";
    const phone = data.instance?.phone || data.phone || "";
    return { success: true, connected, phone, state };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function disconnectInstance(instanceName: string): Promise<{ success: boolean; error?: string }> {
  checkConfig();
  try {
    const res = await fetch(`${API_URL}/instance/delete/${instanceName}`, {
      method: "DELETE",
      headers: headers(),
    });
    const data = await res.json();
    if (!res.ok && data.error) {
      return { success: false, error: data.error };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function logoutInstance(instanceName: string): Promise<{ success: boolean; error?: string }> {
  checkConfig();
  try {
    const res = await fetch(`${API_URL}/instance/logout/${instanceName}`, {
      method: "DELETE",
      headers: headers(),
    });
    const data = await res.json();
    if (!res.ok && data.error) {
      return { success: false, error: data.error };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function sendTextMessage(
  instanceName: string,
  number: string,
  text: string
): Promise<{ success: boolean; error?: string }> {
  checkConfig();
  try {
    const res = await fetch(`${API_URL}/message/sendText/${instanceName}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ number, text }),
    });
    const data = await res.json();
    if (!res.ok && data.error) {
      return { success: false, error: data.error };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
