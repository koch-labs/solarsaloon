import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";
import { User } from "../../../models/types";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  try {
    const { limit, page } = Object.assign(
      { limit: 20, page: 0 },
      request.query
    );

    const usersQuery = await sql`SELECT * FROM users LIMIT ${limit} OFFSET ${
      limit * page
    };`;

    return response.status(200).json({
      users: usersQuery.rows.map((r) => {
        const u: User = {
          publicKey: r.publickey,
          username: r.username,
          lastLogin: r.lastlogin,
        };
        return u;
      }),
    });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error });
  }
}
