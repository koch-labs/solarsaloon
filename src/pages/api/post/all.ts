import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";
import jwt from "jsonwebtoken";
import { Post, Saloon, Subscription, User } from "../../../models/types";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  BidState,
  BidStateJSON,
  CollectionConfig,
  TokenState,
  getBidStateKey,
  getConfigKey,
  getTokenStateKey,
} from "@koch-labs/rent-nft";
import { tokens } from "../../../utils/tokens";
import { TOKEN_2022_PROGRAM_ID, getAccount } from "@solana/spl-token";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  try {
    const { limit, page, mint } = Object.assign(
      { limit: 20, page: 0 },
      request.query
    );

    if (!mint) {
      return response.status(400).json({});
    }

    const tokenMint = mint as string;
    const rawToken = request.headers.authorization.split("Bearer ")[1];
    const user = jwt.decode(rawToken) as User;

    // Find the token state
    const connection = new Connection(
      (process.env.SOLANA_NETWORK === "devnet"
        ? process.env.HELIUS_RPC_DEVNET
        : process.env.HELIUS_RPC_MAINNET) +
        "?api-key=" +
        process.env.HELIUS_KEY
    );
    const largestOwners = await connection.getTokenLargestAccounts(
      new PublicKey(tokenMint)
    );
    const currentOwner = (
      await getAccount(
        connection,
        largestOwners.value[0].address,
        undefined,
        TOKEN_2022_PROGRAM_ID
      )
    ).owner;

    let posts = [];
    const ownerQuery =
      await sql`SELECT * FROM users JOIN saloons ON users.publicKey = saloons.owner WHERE owner = ${user.publicKey}`;
    if (
      currentOwner.toString() === user?.publicKey ||
      ownerQuery.rowCount > 0
    ) {
      // User is the creator
      const postsQuery = await sql`
          SELECT * FROM 
          posts
          JOIN saloons USING (collectionMint)
          JOIN subscriptions USING (collectionMint)
          WHERE subscriptions.tokenMint = ${tokenMint}
          ORDER BY creationTimestamp DESC
          LIMIT ${limit} OFFSET ${limit * page}
          `;
      posts = postsQuery.rows;
    }
    posts = posts.map(
      (r): Post => ({
        id: r.id,
        creator: {
          username: r.username,
          lastLogin: r.lastlogin,
          publicKey: r.creator,
        },
        collectionMint: r.collectionMint,
        content: r.content,
        draft: r.draft,
        creationTimestamp: r.creationtimestamp,
      })
    );

    return response.status(200).json({
      posts,
    });
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error });
  }
}
