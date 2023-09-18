import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";
import { PublicKey } from "@solana/web3.js";
import { verify } from "@noble/ed25519";
import { utils } from "@coral-xyz/anchor";
import jwt from "jsonwebtoken";
import { TOKEN_EXPIRATION_DELAY } from "../../../utils/constants";
import { User } from "../../../models/types";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  try {
    const { challenge, signature }: { challenge: string; signature: string } =
      JSON.parse(request.body);
    const [pubkey, timestamp] = challenge.split(" ");

    if (Number(timestamp) + TOKEN_EXPIRATION_DELAY <= Date.now()) {
      return response.status(419).json({});
    }

    const publicKey = new PublicKey(pubkey);
    const verified = await verify(
      Uint8Array.from(utils.bytes.hex.decode(signature)),
      Uint8Array.from(utils.bytes.utf8.encode(challenge)),
      publicKey.toBytes()
    );

    if (verified) {
      // Find the associated user
      const findUser = async (publicKey: PublicKey): Promise<User> => {
        const findUserQuery =
          await sql`SELECT * FROM users WHERE publicKey = ${publicKey.toString()};`;
        if (findUserQuery.rowCount === 0) {
          await sql`INSERT INTO users (publicKey, lastLogin) VALUES (${publicKey.toString()}, CURRENT_TIMESTAMP);`;
        } else {
          await sql`UPDATE users SET lastLogin=CURRENT_TIMESTAMP;`;
        }

        const selectedUser =
          await sql`SELECT * FROM users WHERE publicKey = ${publicKey.toString()};`;
        const row = selectedUser.rows[0];
        return {
          id: row.id,
          publicKey: row.publickey,
          lastLogin: row.lastlogin,
        };
      };

      const user = await findUser(publicKey);

      // Generate a JWT token
      const token = jwt.sign(user, process.env.JWT_KEY, {
        expiresIn: "1D",
      });

      return response.status(200).json({
        token,
        user,
      });
    } else {
      return response.status(401).json({});
    }
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error });
  }
}
