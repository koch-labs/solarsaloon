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
import { Fetchable } from "../../hooks/useSaloon";

const CreateSubscription: React.FC<{
  saloon: Fetchable<Saloon>;
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
      const tx = new Transaction();
      const {
        value: { blockhash, lastValidBlockHeight },
        context: { slot },
      } = await connection.getLatestBlockhashAndContext();
      tx.recentBlockhash = blockhash;
      tx.lastValidBlockHeight = lastValidBlockHeight;
      tx.feePayer = wallet.publicKey;
      tx.minNonceContextSlot = slot;

      const name = "Subscription";
      const content = {
        name,
        external_uri: "",
      };
      tx.add(
        await rentBuilders
          .createToken({
            provider,
            uri: BASE_URL + `/metadata/${tokenMintKeypair.publicKey}`,
            contentHash: [
              ...utils.bytes.utf8
                .encode(utils.sha256.hash(JSON.stringify(content)))
                .values(),
            ],
            name,
            collectionMint: new PublicKey(saloon.collectionMint),
            tokenMint: tokenMintKeypair.publicKey,
            authoritiesGroup: new PublicKey(saloon.authoritiesGroup),
          })
          .builder.transaction()
      );

      tx.sign(tokenMintKeypair);
      const signedTx = await wallet.signTransaction(tx);
      await connection.sendRawTransaction(signedTx.serialize());

      await fetch("/api/subscription", {
        method: "POST",
        body: JSON.stringify({ saloon, tokenMint: tokenMintKeypair.publicKey }),
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.log(err);
      toast.error(String(err));
      saloon.reload();
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
