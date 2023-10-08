// Next, React
import { FC, useState } from "react";
import { Box, Flex, Text } from "@radix-ui/themes";
import { SaloonsList } from "./SaloonsList";
import { CreateSaloonCard } from "./CreateSaloonCard";
import TagsPicker from "../../components/TagsPicker";
import useSaloons from "../../hooks/useSaloons";

export const SaloonsListView: FC = ({}) => {
  const [creator, setCreator] = useState<string>();
  const [tags, setTags] = useState<string[]>([]);
  const saloons = useSaloons({ creator, tags });

  return (
    <Box className="flex flex-col gap-3">
      <CreateSaloonCard />
      <Flex align="center" direction="column">
        <Flex gap="2" align="center">
          <Text>Filter by tags:</Text>
          <TagsPicker
            tags={tags}
            setTags={(t) => {
              setTags(t);
              saloons.reload();
            }}
            edit
          />
        </Flex>
      </Flex>
      <SaloonsList saloons={saloons} />
    </Box>
  );
};
