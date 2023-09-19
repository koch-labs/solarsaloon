import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";
import jwt from "jsonwebtoken";
import { User } from "../../../models/types";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  try {
    const { subscriptionId, saloonId, content } = JSON.parse(request.body);
    const rawToken = request.headers.authorization.split("Bearer ")[1];
    const user = jwt.verify(rawToken, process.env.JWT_KEY) as User;

    // Check post cooldown for subscription
    const cdQuery =
      await sql`SELECT COUNT(*) FROM subscriptions JOIN saloons ON subscriptions.saloonId = saloons.id WHERE subscriptions.lastPost + (saloons.postCooldown || ' milliseconds')::interval <= CURRENT_TIMESTAMP OR saloons.ownerId = ${user.id}`;
    if (cdQuery.rows[0].count === "0") {
      return response.status(425).json({});
    }

    await sql`UPDATE subscriptions SET lastPost = CURRENT_TIMESTAMP WHERE id = ${subscriptionId} AND saloonId = ${saloonId};`;
    await sql`INSERT INTO posts (creatorId, saloonId, content, draft, creationTimestamp) VALUES (${user.id}, ${saloonId}, ${content}, false, CURRENT_TIMESTAMP);`;

    return response.status(200).json({});
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error });
  }
}
