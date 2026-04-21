import axios, { Method } from "axios";

const MONO_API_BASE_URL =
  process.env.MONO_API_BASE_URL || "https://api.withmono.com";
const MONO_SECRET_KEY = process.env.MONO_SECRET_KEY; // TODO: Remove fallback in production

interface MonoApiRequestOptions {
  method: Method;
  endpoint: string; // e.g. "/v3/lookup/nin"
  data?: any;
  params?: any;
  headers?: Record<string, string>;
}

export async function monoApiRequest<T = any>({
  method,
  endpoint,
  data,
  params,
  headers = {},
}: MonoApiRequestOptions): Promise<T> {
  try {
    const response = await axios({
      method,
      url: `${MONO_API_BASE_URL}${endpoint}`,
      data,
      params,
      headers: {
        "mono-sec-key": "live_sk_sjf85aysukvx132r27iy",
        "Content-Type": "application/json",
        accept: "application/json",
        ...headers,
      },
      // maxBodyLength: Infinity,
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error.message;
  }
}

//  NIN lookup
export async function lookupNIN(nin: string) {
  return monoApiRequest({
    method: "POST",
    endpoint: "/v3/lookup/nin",
    data: { nin },
  });
}

// TIN lookup
export async function lookupTIN(number: string, channel: string = "TIN") {
  return monoApiRequest({
    method: "POST",
    endpoint: "/v3/lookup/tin",
    data: { number, channel },
  });
}

// Account number lookup
export async function lookupAccountNumber(
  nip_code: string,
  account_number: string
) {
  return monoApiRequest({
    method: "POST",
    endpoint: "/v3/lookup/account-number",
    data: { nip_code, account_number },
  });
}
