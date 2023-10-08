import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";
import jwt from "jsonwebtoken";
import { User } from "../../../models/types";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  try {
    const { collectionMint, authoritiesGroup, taxMint, postCooldown, tags } =
      JSON.parse(request.body);
    const rawToken = request.headers.authorization.split("Bearer ")[1];
    const user = jwt.verify(rawToken, process.env.JWT_KEY) as User;
    await sql`
    INSERT INTO saloons (collectionMint, owner, authoritiesGroup, taxMint, postCooldown, tags)
    VALUES (${collectionMint}, ${user.publicKey}, ${authoritiesGroup}, ${taxMint}, ${postCooldown}, ${tags});
    `;

    const query =
      await sql`SELECT * FROM saloons WHERE collectionMint = ${collectionMint}`;
    return response.status(200).json({ saloon: query.rows[0] });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error });
  }
}
