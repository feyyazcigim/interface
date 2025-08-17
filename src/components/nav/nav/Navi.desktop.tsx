import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/NavigationMenu";
import { isDev } from "@/utils/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Link as ReactLink, useLocation } from "react-router-dom";
import { navLinks } from "./Navbar";

const Link = ({
  href,
  active,
  topMenu,
  className,
  ...props
}: {
  href?: string;
  active?: boolean;
  topMenu?: boolean;
  className?: string;
  [x: string]: any;
}) => {
  const location = useLocation();
  const topMenuCheck = href ? location.pathname.includes(href?.substring(1)) : false;
  const bottomMenuCheck = href ? location.pathname.startsWith(href) : false;
  const isActive = active || (href === "/" ? href === location.pathname : topMenu ? topMenuCheck : bottomMenuCheck);

  if (href) {
    return (
      <NavigationMenuLink
        asChild
        active={isActive}
        className={`${className} ${topMenu ? `text-[1.5rem] data-[active]:text-black` : `text-[1.25rem] data-[active]:text-pinto-green-4`} font-[400] hover:cursor-pointer`}
      >
        <ReactLink to={href} className={navigationMenuTriggerStyle()} {...props} />
      </NavigationMenuLink>
    );
  }

  return (
    <NavigationMenuLink
      asChild
      active={isActive}
      className={`${className} ${topMenu ? `text-[1.5rem] data-[active]:text-black` : `text-[1.25rem]`} font-[400] hover:cursor-pointer`}
    >
      <div className={navigationMenuTriggerStyle()} {...props} />
    </NavigationMenuLink>
  );
};

const AppNavi = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="pt-2"
    >
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <Link href={navLinks.overview}>Overview</Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href={navLinks.silo}>Silo</Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href={navLinks.field}>Field</Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href={navLinks.swap}>Swap</Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href={navLinks.podmarket}>Pod Market</Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href={navLinks.sPinto}>sPinto</Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href={navLinks.collection}>?</Link>
          </NavigationMenuItem>
          {isDev() && (
            <NavigationMenuItem>
              <Link href="/dev">Dev</Link>
            </NavigationMenuItem>
          )}
        </NavigationMenuList>
      </NavigationMenu>
    </motion.div>
  );
};

const LearnNavi = ({ setNaviTab }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="pt-2"
    >
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <Link href={navLinks.docs} rel="noopener noreferrer" target="_blank">
              Docs
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href={navLinks.blog} rel="noopener noreferrer" target="_blank">
              Blog
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href={navLinks.communityBlog} rel="noopener noreferrer" target="_blank">
              Community Blog
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href={navLinks.whitepaper} rel="noopener noreferrer" target="_blank">
              Whitepaper
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </motion.div>
  );
};

export default function Navi() {
  const [naviTab, setNaviTab] = useState("home");
  const location = useLocation();
  const isOnExplorer = location.pathname.startsWith("/explorer");

  return (
    <div className="flex flex-col items-center justify-center gap-2 z-[2]">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem onMouseEnter={() => setNaviTab("home")}>
            <Link href={navLinks.overview} topMenu>
              Home
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem onMouseEnter={() => setNaviTab("learn")}>
            <Link active={naviTab === "learn"} topMenu>
              Learn
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href={navLinks.explorer} topMenu>
              Data
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <div className="h-[60px]">
        <AnimatePresence mode="wait">
          {!isOnExplorer && naviTab === "home" && <AppNavi />}
          {!isOnExplorer && naviTab === "learn" && <LearnNavi setNaviTab={setNaviTab} />}
        </AnimatePresence>
      </div>
    </div>
  );
}
