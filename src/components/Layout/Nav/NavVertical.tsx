import {
  HomeIcon,
  HandIcon,
  MagicWandIcon,
  ListBulletIcon,
  TimerIcon,
  CubeIcon,
} from "@radix-ui/react-icons";
import Link from "next/link";
import React from "react";

const NavVertical: React.FC = () => {
  const active =
    "group flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 bg-slate-200 mb-1-slate-200";
  const inactive =
    "group flex items-center rounded-md px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100 transparent";
  return (
    <nav className="grid items-start gap-2">
      <div>
        <Link
          href="/dashboard"
          className={(({ isActive }) => (isActive ? active : inactive))()}
        >
          <HomeIcon className="mr-2" />
          <span>Dashboard </span>
        </Link>
        <Link
          href="/imagine"
          className={(({ isActive }) => (isActive ? active : inactive))()}
        >
          <MagicWandIcon className="mr-2" />
          <span>Imagine</span>
        </Link>
        <Link
          href="/elevation"
          data-bcup-haslogintext="no"
          className={(({ isActive }) => (isActive ? active : inactive))()}
        >
          <CubeIcon className="mr-2" />
          <span>Elevation </span>
        </Link>
        <Link
          href="/interior"
          data-bcup-haslogintext="no"
          className={(({ isActive }) => (isActive ? active : inactive))()}
        >
          <HandIcon className="mr-2" />
          <span>Interior</span>
        </Link>
        <Link
          href="/history"
          data-bcup-haslogintext="no"
          className={(({ isActive }) => (isActive ? active : inactive))()}
        >
          <TimerIcon className="mr-2" />
          <span>History</span>
        </Link>
        <Link
          href="/settings"
          data-bcup-haslogintext="no"
          className={(({ isActive }) => (isActive ? active : inactive))()}
        >
          <ListBulletIcon className="mr-2" />
          <span>Settings</span>
        </Link>
      </div>
    </nav>
  );
};
export default NavVertical;
