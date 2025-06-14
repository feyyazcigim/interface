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
import { Link as ReactLink, useLocation, useMatch } from "react-router-dom";
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

const DataNavi = ({ setNaviTab }) => {
  return (
    <motion.div
      onMouseLeave={() => setNaviTab("home")}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <Link href={navLinks.explorer_pinto}>Pinto</Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href={navLinks.explorer_silo}>Silo</Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href={navLinks.explorer_field}>Field</Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href={navLinks.explorer_farmer}>Farmer</Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href={navLinks.explorer_seasons}>Seasons</Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href={navLinks.explorer_all}>All</Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </motion.div>
  );
};

const LearnNavi = ({ setNaviTab }) => {
  return (
    <motion.div
      onMouseLeave={() => setNaviTab("home")}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
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
            <Link href={navLinks.whitepaper} rel="noopener noreferrer" target="_blank">
              Whitepaper
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </motion.div>
  );
};

const MoreNavi = ({ setNaviTab }) => {
  return (
    <motion.div
      onMouseLeave={() => setNaviTab("home")}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <Link href={navLinks.about}>About</Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href={navLinks.discord} rel="noopener noreferrer" target="_blank">
              Discord
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href={navLinks.twitter} rel="noopener noreferrer" target="_blank">
              X
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href={navLinks.github} rel="noopener noreferrer" target="_blank">
              GitHub
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href={navLinks.disclosures} rel="noopener noreferrer" target="_blank">
              Terms of Service
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <Link href={navLinks.exchange} rel="noopener noreferrer" target="_blank">
              Exchange
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </motion.div>
  );
};

export default function Navi() {
  const [naviTab, setNaviTab] = useState("home");
  const isHome = useMatch("/");

  return (
    <div className="flex flex-col items-center justify-center gap-5 z-[2]">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem onMouseEnter={() => setNaviTab("home")}>
            <Link active={naviTab === "home"} href={navLinks.overview} topMenu>
              Home
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem onMouseEnter={() => setNaviTab("learn")}>
            <Link active={naviTab === "learn"} topMenu>
              Learn
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem onMouseEnter={() => setNaviTab("data")}>
            <Link active={naviTab === "data"} href={navLinks.explorer} topMenu>
              Data
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem onMouseEnter={() => setNaviTab("more")}>
            <Link active={naviTab === "more"} topMenu>
              More
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      {!isHome && (
        <AnimatePresence mode="wait">
          {naviTab === "home" && <AppNavi />}
          {naviTab === "data" && <DataNavi setNaviTab={setNaviTab} />}
          {naviTab === "learn" && <LearnNavi setNaviTab={setNaviTab} />}
          {naviTab === "more" && <MoreNavi setNaviTab={setNaviTab} />}
        </AnimatePresence>
      )}
    </div>
  );
}
