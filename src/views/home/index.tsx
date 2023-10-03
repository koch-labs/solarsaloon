// Next, React
import { FC, useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  Container,
  Flex,
  Heading,
  Text,
} from "@radix-ui/themes";
import Link from "next/link";
import { Saloon, User } from "../../models/types";
import { SaloonsList } from "../saloon/SaloonsList";
import { CreateSaloonCard } from "../saloon/CreateSaloonCard";
import NavigationPath from "../../components/NavigationPath";

export const HomeView: FC = ({}) => {
  const [saloons, setSaloons] = useState<Saloon[]>([]);

  useEffect(() => {
    async function fetchSaloons() {
      const { saloons } = await (await fetch("/api/saloon/all")).json();
      setSaloons(saloons);
    }

    fetchSaloons();
  }, []);

  return (
    <Box className="flex flex-col gap-3">
      <CreateSaloonCard />
      <SaloonsList saloons={saloons} />
    </Box>
  );
};
