import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";
import { PublicKey } from "@solana/web3.js";
import { Saloon } from "../../../models/types";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  try {
    const { mint } = request.query;

    const query =
      await sql`SELECT * FROM saloons JOIN users ON saloons.ownerid = users.id WHERE collectionMint = ${
        mint as string
      }`;

    if (query.rowCount === 0) {
      return response.status(404).json({
        message: `Found no saloon that had ${mint} as a collection mint`,
      });
    }

    const rawSaloon = query.rows[0];
    console.log(query);
    const saloon: Saloon = {
      id: rawSaloon.id,
      owner: {
        id: rawSaloon.ownerid,
        publicKey: rawSaloon.publickey,
        lastLogin: rawSaloon.lastlogin,
      },
      collectionMint: rawSaloon.collectionmint,
      taxMint: rawSaloon.taxmint,
      authoritiesGroup: rawSaloon.authoritiesgroup,
    };
    return response.status(200).json({ saloon });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error });
  }
}
