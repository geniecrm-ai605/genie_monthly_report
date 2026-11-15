let cached: { token: string; exp: number } | null = null;
import { connection } from "next/server";
async function getToken() {
  if (cached && cached.exp > Date.now() + 60_000) return cached.token;


  const res = await fetch(
    `https://login.microsoftonline.com/${process.env.DATAVERSE_TENANT_ID}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: process.env.DATAVERSE_CLIENT_ID!,
        client_secret: process.env.DATAVERSE_CLIENT_SECRET!,
        scope: `${process.env.DATAVERSE_URL}/.default`,
      }),
    }
  );

  if (!res.ok) throw new Error("Dataverse token failed");
  
  const j = await res.json();
  
  cached = { token: j.access_token, exp: Date.now() + j.expires_in * 1000 };
  
  return cached.token;

}

export async function dv(path: string, init: RequestInit = {}) {
  await connection(); // request time par chalao, prerender me nahi
  const token = await getToken();
  const res = await fetch(`${process.env.DATAVERSE_URL}/api/data/v9.2/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "OData-Version": "4.0",
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`Dataverse ${res.status}: ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}