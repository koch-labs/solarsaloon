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
    console.log(`querying subscription page=${page} limit=${limit}`);

    const subQuery = await sql`
    SELECT * FROM 
    (SELECT * FROM 
      subscriptions
      JOIN saloons ON subscriptions.collectionMint = saloons.collectionMint
      JOIN saloonMetadata ON subscriptions.collectionMint = saloonMetadata.collectionMint
      WHERE tokenMint = ${mint as string}
    ) AS s JOIN users ON users.publicKey = s.owner
    ;`;

    if (subQuery.rowCount === 0) {
      return response.status(404).json({
        message: `Found no subscription that had ${mint} as a token mint`,
      });
    }

    const subscriptionRow = subQuery.rows[0];

    // Find the token state
    const connection = new Connection(
      (process.env.SOLANA_NETWORK === "devnet"
        ? process.env.HELIUS_RPC_DEVNET
        : process.env.HELIUS_RPC_MAINNET) +
        "?api-key=" +
        process.env.HELIUS_KEY
    );
    const [tokenStateAccount, configAccount] =
      await connection.getMultipleAccountsInfo([
        getTokenStateKey(
          new PublicKey(subscriptionRow.collectionmint),
          new PublicKey(subscriptionRow.tokenmint)
        ),
        getConfigKey(new PublicKey(subscriptionRow.collectionmint)),
      ]);
    const tokenState = TokenState.decode(tokenStateAccount.data).toJSON();
    const config = CollectionConfig.decode(configAccount.data).toJSON();

    const largestOwners = await connection.getTokenLargestAccounts(
      new PublicKey(subscriptionRow.tokenmint)
    );
    const currentOwner = (
      await getAccount(
        connection,
        largestOwners.value[0].address,
        undefined,
        TOKEN_2022_PROGRAM_ID
      )
    ).owner;

    const ownerQuery = await sql`
    SELECT * FROM users WHERE users.publicKey = ${currentOwner.toString()}
    `;

    const subscription: Subscription = {
      tokenMint: subscriptionRow.tokenmint,
      lastPost: subscriptionRow.lastpost,
      tokenState: tokenState,
      currentOwner: {
        publicKey: ownerQuery.rows[0]?.publickey,
        username: ownerQuery.rows[0]?.username,
        lastLogin: ownerQuery.rows[0]?.lastlogin,
      },
      ownerChangedTimestamp: subscriptionRow.ownerchangedtimestamp,
      expirationTimestamp: subscriptionRow.expirationtimestamp,
    };
    const saloon: Saloon = {
      owner: {
        publicKey: subscriptionRow.publickey,
        username: subscriptionRow.username,
        lastLogin: subscriptionRow.lastlogin,
      },
      collectionMint: subscriptionRow.collectionmint,
      taxMint: subscriptionRow.taxmint,
      authoritiesGroup: subscriptionRow.authoritiesgroup,
      config,
      postCooldown: subscriptionRow.postcooldown,
      metadata: subscriptionRow.metadata,
    };

    // Check if the querier has a bidding account or owns the token
    try {
      const rawToken = request.headers.authorization.split("Bearer ")[1];
      const user = jwt.decode(rawToken) as User;
      let bidState: BidStateJSON, ownerBidState: BidStateJSON;
      let userBalance = 0;
      let posts = [];
      if (user?.publicKey) {
        const bidStates = [
          getBidStateKey(
            new PublicKey(saloon.collectionMint),
            new PublicKey(subscription.tokenMint),
            new PublicKey(user.publicKey)
          ),
          tokenState.ownerBidState
            ? new PublicKey(tokenState.ownerBidState)
            : null,
        ].filter(Boolean);
        const accountInfos = await connection.getMultipleAccountsInfo(
          bidStates
        );
        bidState = accountInfos[0]
          ? BidState.decode(accountInfos[0].data).toJSON()
          : undefined;
        ownerBidState = accountInfos[1]
          ? BidState.decode(accountInfos[1].data).toJSON()
          : undefined;

        if (saloon.taxMint === tokens[0].publicKey.toString()) {
          const balance = await connection.getBalance(
            new PublicKey(user.publicKey)
          );
          userBalance = balance / LAMPORTS_PER_SOL;
        } else {
          const userAccount = await connection.getTokenAccountBalance(
            new PublicKey(saloon.taxMint)
          );
          userBalance = userAccount.value.uiAmount;
        }

        if (
          user.publicKey === saloon.owner.publicKey ||
          user.publicKey === subscription.currentOwner.publicKey
        ) {
          // User is the creator
          const postsQuery = await sql`
          SELECT * FROM posts JOIN saloons ON posts.collectionMint = saloons.collectionMint
          WHERE posts.collectionMint = ${saloon.collectionMint}
          ORDER BY creationTimestamp DESC
          LIMIT ${limit} OFFSET ${limit * page}
          `;
          posts = postsQuery.rows;
        }
        // else if () {
        //   // The user is subscribed
        //   // Can only view post starting from the moment it joined
        //   const postsQuery = await sql`
        //   SELECT * FROM posts AS P JOIN saloons AS sa ON p.collectionMint = sa.collectionMint JOIN subscriptions AS su ON p.collectionMint = su.collectionMint
        //   WHERE p.collectionMint = ${
        //     saloon.collectionMint
        //   } AND ownerChangedTimestamp <= creationTimestamp
        //   ORDER BY creationTimestamp DESC
        //   LIMIT ${limit} OFFSET ${limit * page}
        //   `;
        //   posts = postsQuery.rows;
        // }
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
      }

      return response.status(200).json({
        subscription,
        saloon,
        tokenState,
        bidState,
        ownerBidState,
        userBalance,
        posts,
      });
    } catch (err) {
      console.log(err);
      return response.status(200).json({ subscription, tokenState, saloon });
    }
  } catch (error) {
    console.log(error);
    return response.status(500).json({ error });
  }
}
