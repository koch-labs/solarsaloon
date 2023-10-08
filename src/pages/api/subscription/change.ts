import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";
import jwt from "jsonwebtoken";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  try {
    const { tokenMint, currentPrice, expirationDate } = JSON.parse(
      request.body
    );
    const rawToken = request.headers.authorization.split("Bearer ")[1];
    jwt.verify(rawToken, process.env.JWT_KEY);

    await sql`
    UPDATE subscriptions SET
    ownerChangedTimestamp=CURRENT_TIMESTAMP,
    expirationTimestamp=${expirationDate},
    currentPrice=${currentPrice}
    WHERE tokenMint = ${tokenMint};`;
    response.status(200).json({});
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error });
  }
}
