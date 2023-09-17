import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";
import { PublicKey } from "@solana/web3.js";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  try {
    const pubkey = new PublicKey(request.query.pubkey);
    return response
      .status(200)
      .json({ challenge: `${pubkey.toString()} ${Date.now()}` });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error });
  }
}
