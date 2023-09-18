import { InfoCircledIcon } from "@radix-ui/react-icons";
import { Button, Card, Flex, Callout, Text } from "@radix-ui/themes";
import React, { useCallback, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, BN, utils } from "@coral-xyz/anchor";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import toast from "react-hot-toast";
import { useRouter } from "next/router";
import { useUser } from "../../contexts/UserContextProvider";
import { BASE_URL } from "../../utils/constants";
import { Saloon } from "../../models/types";

// HACK: Fixs @solana/web3.js import
// import fetch from "node-fetch";
// globalThis.fetch = fetch as any;
import encoding from "encoding";
import { builders as rentBuilders } from "@koch-labs/rent-nft";

const CreateSubscription: React.FC<{
  saloon: Saloon;
}> = ({ saloon }) => {
  const router = useRouter();
  const wallet = useWallet();
  const { isSignedIn, token, user } = useUser();
  const { connection } = useConnection();
  const provider = useMemo(
    () =>
      wallet ? new AnchorProvider(connection, wallet as any, {}) : undefined,
    [wallet, connection]
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateSubscription = useCallback(async () => {
    console.log(provider, wallet, saloon);
    if (!provider || !wallet.signAllTransactions || !wallet.publicKey) return;

    setIsLoading(true);
    try {
      const tokenMintKeypair = Keypair.generate();
      const txs: Transaction[] = [];
      const {
        value: { blockhash, lastValidBlockHeight },
        context: { slot },
      } = await connection.getLatestBlockhashAndContext();

      const name = "Subscription";
      const content = {
        name,
        external_uri: "",
      };
      console.log(utils.sha256.hash(JSON.stringify(content)));
      txs.push(
        await rentBuilders
          .createToken({
            provider,
            uri: BASE_URL + `/metadata/${tokenMintKeypair.publicKey}`,
            contentHash: utils.sha256.hash(JSON.stringify(content)),
            name,
            collectionMint: new PublicKey(saloon.collectionMint),
            authoritiesGroup: new PublicKey(saloon.authoritiesGroup),
          })
          .builder.transaction()
      );

      txs.forEach((tx) => {
        tx.feePayer = wallet.publicKey!;
        tx.recentBlockhash = blockhash;
        tx.lastValidBlockHeight = lastValidBlockHeight;
        tx.minNonceContextSlot = slot;
        return tx;
      });

      const signedTxs = await wallet.signAllTransactions(txs);
      for (const tx of signedTxs) {
        await connection.sendRawTransaction(tx.serialize(), {
          skipPreflight: true,
        });
      }

      await fetch("/api/subscription", {
        method: "POST",
        body: JSON.stringify({ saloon }),
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.log(err);
      toast.error(String(err));
    } finally {
      setIsLoading(false);
    }
  }, [saloon, token, provider, connection, wallet]);

  return (
    <Card>
      <Flex gap="2" direction="column" align="center">
        <Text size="5" weight="bold">
          Create a subscription
        </Text>
        <Button onClick={handleCreateSubscription}>
          Create a new subscription
        </Button>
        <Callout.Root>
          <Callout.Icon>
            <InfoCircledIcon />
          </Callout.Icon>
          <Callout.Text>
            Subscriptions can only be created, not destroyed so be careful when
            creating more.
          </Callout.Text>
        </Callout.Root>
      </Flex>
    </Card>
  );
};

export default CreateSubscription;
