import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";
import jwt from "jsonwebtoken";
import { Saloon, User } from "../../../models/types";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  try {
    const rawToken = request.headers.authorization.split("Bearer ")[1];
    const user = jwt.verify(rawToken, process.env.JWT_KEY) as User;
    const { saloon, tokenMint }: { saloon: Saloon; tokenMint: string } =
      JSON.parse(request.body);

    // The sender is the saloon's owner
    if (user.id !== saloon.owner.id) {
      return response.status(403).json({});
    }

    await sql`INSERT INTO subscriptions (tokenMint, saloonId, lastPost) VALUES (${tokenMint}, ${saloon.id}, TO_TIMESTAMP(0));`;
    return response.status(200).json({});
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error });
  }
}
