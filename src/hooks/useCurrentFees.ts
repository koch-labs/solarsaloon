import { BN } from "@coral-xyz/anchor";
import { Token } from "../utils/tokens";
import { useEffect, useState } from "react";
import numeral from "numeral";
import { useWallet } from "@solana/wallet-adapter-react";
import { FullSubscription } from "../models/types";

export default function useCurrentFees({
  token,
  subscription,
}: {
  token?: Token;
  subscription?: FullSubscription;
  increasing?: boolean;
}) {
  const wallet = useWallet();
  const taxesPerYear = new BN(
    subscription?.tokenState?.currentSellingPrice || 0
  )
    .mul(new BN(subscription?.saloon?.config?.taxRate || 0))
    .div(new BN(10000));
  const timeLeft = !taxesPerYear.eq(new BN(0))
    ? Number(
        numeral(
          new BN(subscription?.ownerBidState?.amount)
            .mul(new BN(31536000000))
            .toString()
        )
          .divide(taxesPerYear.toString())
          .format("0.0")
      )
    : 0;
  const [amount, setAmount] = useState<string>(
    numeral(subscription?.ownerBidState?.amount || "0").format("0.000a")
  );

  useEffect(() => {
    const interval = setInterval(() => {
      if (!subscription?.bidState) {
        setAmount(numeral("0").format("0.000a"));
        return;
      } else if (
        subscription?.ownerBidState?.bidder !== wallet?.publicKey?.toString()
      ) {
        setAmount(
          numeral(subscription.bidState?.amount)
            .divide(10 ** (token?.decimals || 0))
            .format("0.000a")
        );
        return;
      }

      setAmount(
        numeral(
          new BN(subscription.ownerBidState?.amount || 0)
            .sub(
              taxesPerYear
                .mul(
                  new BN(
                    Math.round(
                      Date.now() / 1000 -
                        Number(subscription?.ownerBidState?.lastUpdate || 0)
                    )
                  )
                )
                .div(new BN(31536000))
            )
            .toString()
        )
          .divide(10 ** (token?.decimals || 0))
          .format("0.000a")
      );
    }, 500);

    return () => clearInterval(interval);
  }, [token, subscription, taxesPerYear, wallet.publicKey]);

  return { amount, taxesPerYear, timeLeft };
}
