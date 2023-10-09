import { InfoCircledIcon } from "@radix-ui/react-icons";
import { Button, Flex, Text, Heading } from "@radix-ui/themes";
import React, { useState } from "react";
import { Fetchable, Saloon } from "../../models/types";
import CreateSubscriptionModal from "./CreateSubscriptionModal";

const CreateSubscription: React.FC<{
  saloon: Saloon;
  reloadSubscriptions: () => void;
}> = ({ saloon, reloadSubscriptions }) => {
  const [openCreate, setOpenCreate] = useState(false);

  return (
    <Flex gap="2" direction="column" align="center" p="5">
      <Heading size="5">create a subscription</Heading>
      <Button onClick={() => setOpenCreate(true)}>
        <Text className="p-3">create a new subscription</Text>
      </Button>
      <Flex align="center" gap="2">
        <InfoCircledIcon />
        <Text className="underline">
          Subscriptions can only be created, not destroyed so be careful when
          creating more.
        </Text>
      </Flex>
      <CreateSubscriptionModal
        saloon={saloon}
        setOpen={setOpenCreate}
        open={openCreate}
        reloadSubscriptions={reloadSubscriptions}
      />
    </Flex>
  );
};

export default CreateSubscription;
