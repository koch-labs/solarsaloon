import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";
import jwt from "jsonwebtoken";
import { User } from "../../../models/types";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  try {
    const { tokenMint, collectionMint, content } = JSON.parse(request.body);
    const rawToken = request.headers.authorization.split("Bearer ")[1];
    const user = jwt.verify(rawToken, process.env.JWT_KEY) as User;

    // Check post cooldown for subscription
    const cdQuery = await sql`
    SELECT COUNT(*) FROM subscriptions JOIN saloons ON subscriptions.saloonId = saloons.id
    WHERE
    subscriptions.tokenMint = ${tokenMint} AND
    subscriptions.lastPost + (saloons.postCooldown || ' milliseconds')::interval <= CURRENT_TIMESTAMP
    `;
    const ownerQuery = await sql`
    SELECT COUNT(*) FROM saloons
    WHERE collectionMint = ${collectionMint} AND owner = ${user.publicKey}
    `;
    console.log(ownerQuery, cdQuery);
    if (cdQuery.rows[0].count === "0" && ownerQuery.rows[0].count === "0") {
      return response.status(425).json({});
    }

    await sql`
    UPDATE subscriptions SET lastPost = CURRENT_TIMESTAMP
    WHERE collectionMint = ${collectionMint} AND tokenMint = ${tokenMint};
    `;
    await sql`
    INSERT INTO posts (creator, collectionMint, content, draft, creationTimestamp)
    VALUES (${user.publicKey}, ${collectionMint}, ${content}, false, CURRENT_TIMESTAMP);
    `;

    return response.status(200).json({});
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error });
  }
}
