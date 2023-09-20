import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";
import jwt from "jsonwebtoken";
import { User } from "../../../models/types";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  try {
    const { subscriptionId } = JSON.parse(request.body);
    const rawToken = request.headers.authorization.split("Bearer ")[1];
    jwt.verify(rawToken, process.env.JWT_KEY);

    await sql`UPDATE subscription SET ownerChangedTimestamp=CURRENT_TIMESTAMP WHERE id = ${subscriptionId};`;
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error });
  }
}
