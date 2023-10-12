import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";

export default function useFees({
  price,
  taxRate,
  lastUpdate,
  depositAmount,
  increaseDeposit,
}: {
  price?: number;
  taxRate?: number;
  lastUpdate?: number;
  depositAmount?: number;
  increaseDeposit?: boolean;
}) {
  const wallet = useWallet();
  const taxesPerYear = (price * taxRate) / 10000;
  const timeLeft: number =
    taxesPerYear !== 0
      ? Math.max(
          0,
          Number(lastUpdate) +
            (depositAmount * 31536000000) / taxesPerYear -
            Date.now()
        )
      : 0;
  const [amount, setAmount] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      if (increaseDeposit) {
        setAmount(
          (depositAmount || 0) +
            (taxesPerYear * Math.round(Date.now() - (lastUpdate || 0))) /
              31536000000
        );
      } else {
        setAmount(
          Math.max(
            0,
            depositAmount -
              (taxesPerYear * Math.round(Date.now() - (lastUpdate || 0))) /
                31536000000
          )
        );
      }
    }, 500);

    return () => clearInterval(interval);
  }, [
    taxesPerYear,
    wallet.publicKey,
    increaseDeposit,
    depositAmount,
    lastUpdate,
  ]);

  return { amount, taxesPerYear, timeLeft };
}
