import { NextApiRequest, NextApiResponse } from "next";
import { sql } from "@vercel/postgres";
import jwt from "jsonwebtoken";
import { Saloon, Subscription, User } from "../../../models/types";
import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  BidState,
  BidStateJSON,
  TokenState,
  getBidStateKey,
  getTokenStateKey,
} from "@koch-labs/rent-nft";
import { tokens } from "../../../utils/tokens";
import { TOKEN_2022_PROGRAM_ID, getAccount } from "@solana/spl-token";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  try {
    const { mint } = request.query;

    const subQuery =
      await sql`SELECT * FROM (SELECT * FROM subscriptions JOIN saloons ON subscriptions.saloonId = saloons.id WHERE tokenMint = ${
        mint as string
      }) AS s JOIN users ON users.id = s.ownerId;`;

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
    const tokenStateAccount = await connection.getAccountInfo(
      getTokenStateKey(
        new PublicKey(subscriptionRow.collectionmint),
        new PublicKey(subscriptionRow.tokenmint)
      )
    );
    const tokenState = TokenState.decode(tokenStateAccount.data).toJSON();

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

    const subscription: Subscription = {
      id: subscriptionRow.id,
      tokenMint: subscriptionRow.tokenmint,
      lastPost: subscriptionRow.lastpost,
      tokenState: tokenState,
      currentOwner: currentOwner.toString(),
    };
    const saloon: Saloon = {
      id: subscriptionRow.saloonid,
      owner: {
        id: subscriptionRow.ownerid,
        publicKey: subscriptionRow.publickey,
        lastLogin: subscriptionRow.lastlogin,
      },
      collectionMint: subscriptionRow.collectionmint,
      taxMint: subscriptionRow.taxmint,
      authoritiesGroup: subscriptionRow.authoritiesgroup,
    };

    // Check if the querier has a bidding account or owns the token
    try {
      const rawToken = request.headers.authorization.split("Bearer ")[1];
      const user = jwt.decode(rawToken) as User;
      let bidState: BidStateJSON, ownerBidState: BidStateJSON;
      let userBalance = 0;
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
      }

      return response.status(200).json({
        subscription,
        saloon,
        tokenState,
        bidState,
        ownerBidState,
        userBalance,
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
