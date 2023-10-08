import numeral from "numeral";
import { Flex, IconButton, Text } from "@radix-ui/themes";
import { formatTime } from "../../utils";
import { useState } from "react";
import { tokens } from "../../utils/tokens";
import { Fetchable, FullSubscription } from "../../models/types";
import { MinusIcon, PlusIcon } from "@heroicons/react/24/outline";
import DepositFundsModal from "./DepositFundsModal";
import WithdrawFundsModal from "./WithdrawFundsModal";
import useFees from "../../hooks/useFees";

export default function DepositWidget({
  subscription: fetchable,
}: {
  subscription: Fetchable<FullSubscription>;
}) {
  const { data: subscription } = fetchable;
  const token = tokens.find(
    (t) => t.publicKey.toString() === subscription?.saloon?.taxMint
  );
  const [openDeposit, setOpenDeposit] = useState(false);
  const [openWithdraw, setOpenWithdraw] = useState(false);
  const { timeLeft, amount } = useFees({
    price: Number(
      numeral(subscription?.tokenState?.currentSellingPrice || 0)
        .divide(10 ** (token?.decimals || 0))
        .format("0.000")
    ),
    taxRate: Number(subscription?.saloon?.config?.taxRate || 0),
    depositAmount: Number(
      numeral(subscription?.bidState?.amount || 0)
        .divide(10 ** (token?.decimals || 0))
        .format("0.000")
    ),
    lastUpdate: Number(subscription?.bidState?.lastUpdate || 0),
    increaseDeposit: false,
  });

  return (
    <Flex align="center" gap="1" justify="between">
      <Flex direction="column">
        <Text>
          {numeral(amount).format("0.000a")} ${token?.symbol} deposited
        </Text>
        <Text weight="light" size="1">
          {formatTime(timeLeft)} left
        </Text>
      </Flex>
      <IconButton variant="surface" onClick={() => setOpenDeposit(true)}>
        <PlusIcon width="16" />
      </IconButton>
      <IconButton
        variant="outline"
        color="gray"
        disabled={amount <= 0}
        onClick={() => setOpenWithdraw(true)}
      >
        <MinusIcon width="16" />
      </IconButton>
      <DepositFundsModal
        setOpen={setOpenDeposit}
        open={openDeposit}
        subscription={fetchable}
      />
      <WithdrawFundsModal
        setOpen={setOpenWithdraw}
        open={openWithdraw}
        subscription={fetchable}
      />
    </Flex>
  );
}
