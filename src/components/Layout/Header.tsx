import AccountNav from "./AccountNav";
import React from "react";
import { Heading } from "@radix-ui/themes";
import Link from "next/link";

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 bg-white pz-4 px-4">
      <div className="flex h-16 items-center justify-between border-b border-b-slate-200 py-4 ">
        <div className="flex gap-6 md:gap-10">
          <Link className="items-center space-x-2" href="/">
            <Heading>Solar Saloon</Heading>
          </Link>
          <nav className="hidden gap-6 md:flex">
            <Link
              className="flex items-center text-lg font-semibold text-slate-600 sm:text-sm"
              href="/saloons"
            >
              Saloons
            </Link>
          </nav>
        </div>
        <AccountNav />
      </div>
    </header>
  );
};

export default Header;
