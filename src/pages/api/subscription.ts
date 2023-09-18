import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";
import jwt from "jsonwebtoken";
import { Saloon, User } from "../../models/types";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  try {
    const rawToken = request.headers.authorization.split("Bearer ")[1];
    const user = jwt.verify(rawToken, process.env.JWT_KEY) as User;
    const { saloon }: { saloon: Saloon } = JSON.parse(request.body);

    if (user.id !== saloon.owner.id) {
      return response.status(401).json({});
    }

    const countQuery =
      await sql`SELECT COUNT(*) FROM subscriptions WHERE id = ${saloon.id};`;
    if (countQuery.rows[0].count !== 1) {
      return response.status(403).json({});
    }

    await sql`INSERT INTO subscriptions (saloonId, lastPost) VALUES (${saloon.id}, 0);`;
    return response.status(200).json({});
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error });
  }
}
