import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  try {
    const query =
      await sql`SELECT * FROM saloons JOIN users on users.id = saloons.ownerid`;
    return response.status(200).json({ saloons: query.rows });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error });
  }
}
