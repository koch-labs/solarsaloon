import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";
import jwt from "jsonwebtoken";
import { User } from "../../contexts/UserContextProvider";
import { Saloon } from "../../views/home";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  try {
    const result = await sql`SELECT * FROM subscriptions WHERE saloonId = ${
      request.query.saloonid as string
    };`;
    return response.status(200).json({ subscriptions: result.rows });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error });
  }
}
