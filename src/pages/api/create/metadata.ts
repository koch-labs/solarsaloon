import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";
import jwt from "jsonwebtoken";
import { User } from "../../../models/types";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  try {
    const { subscription, saloon, mint } = JSON.parse(request.body);
    const rawToken = request.headers.authorization.split("Bearer ")[1];
    const user = jwt.verify(rawToken, process.env.JWT_KEY) as User;

    if (saloon) {
      await sql`
      INSERT INTO saloonMetadata (collectionMint, metadata)
      VALUES (${mint}, ${saloon});
      `;
    } else if (saloon) {
      await sql`
      INSERT INTO subscriptionMetadata (tokenMint, metadata)
      VALUES (${mint}, ${subscription});
      `;
    } else {
      return response.status(408).json({});
    }

    return response.status(200).json({});
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error });
  }
}
