import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/NavigationMenu";
import { stringEq } from "@/utils/string";
import { isDev } from "@/utils/utils";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useRef, useState } from "react";
import { Link as ReactLink, useLocation, useMatch } from "react-router-dom";
import { navLinks, navPathNameToTopMenu } from "./Navbar";

const Link = ({
  topMenuSlug = "home",
  href,
  active,
  topMenu,
  className,
  ...props
}: {
  topMenuSlug?: string;
  href?: string;
  active?: boolean;
  topMenu?: boolean;
  className?: string;
  [x: string]: any;
}) => {
  const location = useLocation();
  const pathSlug = location.pathname.split("/")?.[1];

  const bottomMenuCheck = href ? location.pathname.startsWith(href) : false;

  const getIsActive = () => {
    if (topMenu && href) {
      return stringEq(topMenuSlug, navPathNameToTopMenu[pathSlug]) || active;
    }

    if (href) {
      return active || (href === "/" ? href === location.pathname : bottomMenuCheck);
    }
  };

  const isActive = getIsActive();

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
            <Link href={navLinks.collection}>Collection</Link>
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
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="pt-2"
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
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = useCallback((tab: string) => {
    // Clear any existing timeout
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }

    // Set timeout for 100ms before activating sub-nav
    hoverTimeoutRef.current = setTimeout(() => {
      setNaviTab(tab);
    }, 100);
  }, []);

  const handleMouseLeave = useCallback(() => {
    // Cancel the timeout if user moves away before 100ms
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-2 z-[2]">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem onMouseEnter={() => handleMouseEnter("home")} onMouseLeave={handleMouseLeave}>
            <Link href={navLinks.overview} topMenu topMenuSlug="home">
              Home
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem onMouseEnter={() => handleMouseEnter("learn")} onMouseLeave={handleMouseLeave}>
            <Link active={naviTab === "learn"} topMenu topMenuSlug="learn">
              Learn
            </Link>
          </NavigationMenuItem>
          <NavigationMenuItem onMouseEnter={() => handleMouseEnter("data")} onMouseLeave={handleMouseLeave}>
            <Link active={naviTab === "data"} href={navLinks.explorer} topMenu topMenuSlug="data">
              Data
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <div className="h-[3.75rem]">
        <AnimatePresence mode="wait">
          {naviTab === "home" && <AppNavi />}
          {naviTab === "data" && <DataNavi setNaviTab={setNaviTab} />}
          {naviTab === "learn" && <LearnNavi setNaviTab={setNaviTab} />}
        </AnimatePresence>
      </div>
    </div>
  );
}
