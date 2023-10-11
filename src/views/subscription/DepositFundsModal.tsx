import { Button, Dialog, Flex, Text, TextField } from "@radix-ui/themes";
import numeral from "numeral";
import { tokens } from "../../utils/tokens";
import { useCallback, useMemo, useState } from "react";
import { PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { getConfigKey, builders as rentBuilders } from "@koch-labs/rent-nft";
import { AnchorProvider, BN } from "@coral-xyz/anchor";
import { FullSubscription } from "../../models/types";
import { Fetchable } from "../../models/types";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import WaitingButton from "../../components/WaitingButton";
import { useCurrentUser } from "../../contexts/UserContextProvider";
import useFees from "../../hooks/useFees";

export default function DepositFundsModal({
  setOpen,
  open,
  subscription,
  externalAccount,
}: {
  setOpen: (boolean) => void;
  open: boolean;
  subscription: Fetchable<FullSubscription>;
  externalAccount?: boolean;
}) {
  const user = useCurrentUser();
  const token = tokens.find(
    (e) => e.publicKey.toString() === subscription?.data?.saloon?.taxMint
  );
  const { connection } = useConnection();
  const wallet = useWallet();
  const provider = useMemo(
    () =>
      wallet ? new AnchorProvider(connection, wallet as any, {}) : undefined,
    [wallet, connection]
  );
  const [amount, setAmount] = useState(0);
  const { timeLeft } = useFees({
    price: Number(
      numeral(subscription?.data?.ownerBidState?.sellingPrice || 0)
        .divide(10 ** (token?.decimals || 0))
        .format("0.000")
    ),
    taxRate: Number(subscription?.data?.saloon?.config?.taxRate),
    lastUpdate: Date.now(),
    depositAmount:
      Number(
        numeral(subscription?.data?.bidState?.amount || 0)
          .divide(10 ** (token?.decimals || 0))
          .format("0.000")
      ) + amount,
    increaseDeposit: false,
  });
  const [isWaiting, setIsWaiting] = useState<boolean>(false);

  const handleDeposit = useCallback(async () => {
    if (!amount) return;

    setIsWaiting(true);

    try {
      const tx = new Transaction();
      const {
        value: { blockhash, lastValidBlockHeight },
        context: { slot },
      } = await connection.getLatestBlockhashAndContext();
      tx.recentBlockhash = blockhash;
      tx.lastValidBlockHeight = lastValidBlockHeight;
      tx.feePayer = wallet.publicKey;
      tx.minNonceContextSlot = slot;

      // Wrap the needed SOL
      if (token.publicKey === tokens[0].publicKey) {
        const wrappedSolAccount = getAssociatedTokenAddressSync(
          token.publicKey,
          wallet.publicKey,
          true,
          token.tokenProgram
        );
        tx.add(
          createAssociatedTokenAccountIdempotentInstruction(
            wallet.publicKey,
            wrappedSolAccount,
            wallet.publicKey,
            token.publicKey,
            token.tokenProgram
          )
        );
        tx.add(
          SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: wrappedSolAccount,
            lamports: Math.round(amount * 10 ** token.decimals),
          })
        );
        tx.add(createSyncNativeInstruction(wrappedSolAccount));
      }

      if (!subscription?.data?.bidState) {
        tx.add(
          await rentBuilders
            .createBid({
              provider,
              collectionMint: new PublicKey(
                subscription?.data?.saloon.collectionMint
              ),
              authoritiesGroup: new PublicKey(
                subscription?.data?.saloon.authoritiesGroup
              ),
              tokenMint: new PublicKey(
                subscription?.data?.subscription?.tokenMint
              ),
              tokenProgram: token.tokenProgram,
            })
            .builder.transaction()
        );
      }
      tx.add(
        await rentBuilders
          .updateBid({
            provider,
            collectionMint: new PublicKey(
              subscription?.data?.saloon.collectionMint
            ),
            tokenMint: new PublicKey(subscription?.data?.tokenState.tokenMint),
          })
          .builder.transaction()
      );
      tx.add(
        createAssociatedTokenAccountIdempotentInstruction(
          wallet.publicKey,
          getAssociatedTokenAddressSync(
            token.publicKey,
            getConfigKey(
              new PublicKey(subscription?.data?.saloon.collectionMint)
            ),
            true,
            token.tokenProgram
          ),
          getConfigKey(
            new PublicKey(subscription?.data?.saloon.collectionMint)
          ),
          token.publicKey,
          token.tokenProgram
        )
      );
      tx.add(
        await rentBuilders
          .increaseBid({
            provider,
            amount: new BN(Math.round(amount * 10 ** token.decimals)),
            collectionMint: new PublicKey(
              subscription?.data?.saloon.collectionMint
            ),
            tokenMint: new PublicKey(
              subscription?.data?.subscription?.tokenMint
            ),
            authoritiesGroup: new PublicKey(
              subscription?.data?.saloon.authoritiesGroup
            ),
            taxMint: new PublicKey(subscription?.data?.saloon.taxMint),
            tokenProgram: token.tokenProgram,
          })
          .builder.transaction()
      );

      const conf = await wallet.sendTransaction(tx, connection);
      await connection.confirmTransaction(conf);

      await fetch("/api/subscription/change", {
        method: "POST",
        body: JSON.stringify({
          tokenMint: subscription?.data?.subscription?.tokenMint,
          currentPrice: numeral(
            subscription?.data?.ownerBidState.sellingPrice || 0
          )
            .divide(10 ** (token?.decimals || 0))
            .format("0.000"),
          expirationDate: new Date(Date.now() + timeLeft).toUTCString(),
        }),
        headers: {
          authorization: `Bearer ${user.token}`,
        },
      });

      subscription.reload();
      setOpen(false);
    } finally {
      setIsWaiting(false);
    }
  }, [
    connection,
    wallet,
    amount,
    provider,
    subscription,
    token,
    setOpen,
    user,
    timeLeft,
  ]);

  return (
    <Dialog.Root open={open}>
      <Dialog.Content style={{ maxWidth: 450 }}>
        <Dialog.Title>Deposit funds</Dialog.Title>
        <Dialog.Description size="2" mb="4"></Dialog.Description>
        <Flex direction="column" gap="1" className="text-sm">
          <Text>
            Choose the amount of {token?.name} you want to deposit in your
            account. This account is only used to bid on this subscription. You
            can withdraw from it at any time.
          </Text>
          <Text>
            To buy the token, you need to have at least the current selling
            price available in your account, plus some extra to pay the taxes
            for your desired duration.
          </Text>
          <Text>
            This account is only debited depending on the time during which you
            own the token and your selling price. Be careful, if you own the
            token and your account reaches 0, others will be able to buy the
            token from you for free.
          </Text>
          {externalAccount ? (
            <Text color="crimson">
              This account belongs to someone else, are you sure you want to
              deposit?
            </Text>
          ) : null}
        </Flex>
        <Flex direction="column" gap="3">
          <label>
            <Flex justify="between" align="center">
              <Text as="div" size="2" mb="1" weight="bold">
                Amount
              </Text>
              <Text weight="light">
                Your balance:{" "}
                {numeral(subscription?.data?.userBalance || 0).format("0.0a")} $
                {token?.symbol || "???"}
              </Text>
            </Flex>

            <TextField.Root>
              <TextField.Input
                placeholder="Enter the amount to deposit..."
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
              />
              <TextField.Slot className="m-1">
                <Button
                  size="1"
                  variant="ghost"
                  onClick={() =>
                    setAmount(Number(subscription?.data?.userBalance))
                  }
                >
                  MAX
                </Button>
              </TextField.Slot>
            </TextField.Root>
          </label>
        </Flex>

        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button
              variant="soft"
              color="gray"
              onClick={() => {
                setOpen(false);
                setIsWaiting(false);
              }}
            >
              Cancel
            </Button>
          </Dialog.Close>
          <Dialog.Close>
            <WaitingButton
              onClick={handleDeposit}
              disabled={!amount}
              loading={isWaiting}
            >
              Deposit
            </WaitingButton>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
