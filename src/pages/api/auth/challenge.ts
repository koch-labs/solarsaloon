import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";
import { PublicKey } from "@solana/web3.js";
import { createChallengeString } from "../../../utils/auth";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  try {
    const pubkey = new PublicKey(request.query.pubkey);
    return response
      .status(200)
      .json({ challenge: createChallengeString(pubkey) });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error });
  }
}
