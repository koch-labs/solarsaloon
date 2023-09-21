import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  try {
    const { limit, page } = Object.assign(
      { limit: 20, page: 0 },
      request.query
    );
    const query =
      await sql`SELECT * FROM saloons JOIN users on users.id = saloons.ownerid LIMIT ${limit} OFFSET ${
        limit * page
      }`;
    return response.status(200).json({
      saloons: query.rows.map((s) => ({
        id: s.id,
        collectionMint: s.collectionmint,
        owner: {
          id: s.ownerid,
          lastLogin: s.lastlogin,
          publicKey: s.publickey,
        },
      })),
    });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error });
  }
}
