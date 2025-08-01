import { cn } from "@/utils/utils";
import { DiscordLogoIcon, GitHubLogoIcon } from "@radix-ui/react-icons";
import { X } from "lucide-react";
import { Link as ReactLink } from "react-router-dom";
import { useMobileActionBarContext } from "./MobileActionBarContext";

interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
  external?: boolean;
  className?: string;
}

const FooterLink = ({ href, children, external = false, className = "" }: FooterLinkProps) => {
  const linkClasses = cn(
    "text-pinto-light hover:text-pinto-green-4 transition-colors duration-200 text-xs sm:text-xs font-medium",
    className,
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={linkClasses}>
        {children}
      </a>
    );
  }

  return (
    <ReactLink to={href} className={linkClasses}>
      {children}
    </ReactLink>
  );
};

interface SocialIconProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

const SocialIcon = ({ href, icon, label }: SocialIconProps) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="text-pinto-light hover:text-pinto-green-4 transition-colors duration-200"
    aria-label={label}
  >
    {icon}
  </a>
);

export default function Footer() {
  const { isMobileActionBarVisible } = useMobileActionBarContext();

  return (
    <footer
      className={cn(
        "border-t border-gray-200 bg-gradient-light mt-auto",
        isMobileActionBarVisible ? "pb-[4.5rem]" : "pb-0",
      )}
    >
      <div className="w-full px-3 py-2 sm:px-6 sm:py-3 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          {/* Links Section - Bottom Left Corner */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <FooterLink href="/?fromNav=true">About Pinto</FooterLink>
            <FooterLink href="https://docs.pinto.money/disclosures" external>
              Terms & Privacy
            </FooterLink>
            <FooterLink href="https://pinto.exchange/" external>
              Pinto Exchange
            </FooterLink>
          </div>

          {/* Social Icons Section - Bottom Right Corner */}
          <div className="flex items-center gap-3 sm:ml-auto">
            <SocialIcon
              href="https://pinto.money/discord"
              icon={<DiscordLogoIcon width={16} height={16} className="sm:w-[18px] sm:h-[18px]" />}
              label="Discord"
            />
            <SocialIcon
              href="https://x.com/pintodotmoney"
              icon={<X width={16} height={16} className="sm:w-[18px] sm:h-[18px]" />}
              label="X (Twitter)"
            />
            <SocialIcon
              href="https://github.com/pinto-org"
              icon={<GitHubLogoIcon width={16} height={16} className="sm:w-[18px] sm:h-[18px]" />}
              label="GitHub"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
