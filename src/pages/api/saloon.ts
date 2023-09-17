import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";
import jwt from "jsonwebtoken";
import { User } from "../../contexts/UserContextProvider";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  try {
    const rawToken = request.headers.authorization.split("Bearer ")[1];
    const user = jwt.verify(rawToken, process.env.JWT_KEY) as User;
    console.log(request.body);
    const { collectionMint } = JSON.parse(request.body);
    console.log(collectionMint, user, typeof user);
    console.log(
      await sql`INSERT INTO saloons (collectionMint, ownerId) VALUES (${collectionMint}, ${user.id});`
    );
    const query =
      await sql`SELECT * FROM saloons WHERE collectionMint = ${collectionMint}`;
    return response.status(200).json({ saloon: query.rows[0] });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error });
  }
}
