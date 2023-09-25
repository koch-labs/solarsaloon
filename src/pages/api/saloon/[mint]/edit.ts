import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";
import jwt from "jsonwebtoken";
import { Saloon, Subscription, User } from "../../../../models/types";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  try {
    const { mint } = request.query;
    const { image, name, description } = JSON.parse(request.body);
    const collectionMint = mint as string;
    const rawToken = request.headers.authorization.split("Bearer ")[1];
    const user = jwt.verify(rawToken, process.env.JWT_KEY) as User;

    const saloonQuery = await sql`
      SELECT * FROM saloons JOIN saloonMetadata ON saloons.collectionMint = saloonMetadata.collectionMint
      WHERE owner = ${user.publicKey} AND saloons.collectionMint = ${collectionMint}
      `;

    if (saloonQuery.rows.length === 0) {
      return response.status(404).json({
        message: `Found no saloon that had ${collectionMint} as a collection mint`,
      });
    }

    console.log(saloonQuery.rows[0], image, name, description);
    const data = saloonQuery.rows[0].metadata;
    data.name = name;
    data.description = description;
    data.image = image;

    await sql`
    UPDATE saloonMetadata SET metadata = ${data}
    WHERE collectionMint = ${collectionMint}
    `;

    return response.status(200).json({});
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error });
  }
}
