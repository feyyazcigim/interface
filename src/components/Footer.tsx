import { ExternalLinkIcon } from "@/components/Icons";
import { cn } from "@/utils/utils";
import { DiscordLogoIcon, GitHubLogoIcon, TwitterLogoIcon } from "@radix-ui/react-icons";
import { Link as ReactLink } from "react-router-dom";
import IconImage from "./ui/IconImage";

interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
  external?: boolean;
  className?: string;
}

const FooterLink = ({ href, children, external = false, className = "" }: FooterLinkProps) => {
  const linkClasses = cn(
    "flex items-center gap-1 text-pinto-light hover:text-pinto-green-4 transition-colors duration-200 text-xs font-medium",
    className,
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={linkClasses}>
        {children}
        <ExternalLinkIcon width={10} height={10} color="currentColor" />
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
    className="p-1 text-pinto-light hover:text-pinto-green-4 transition-colors duration-200 rounded-md hover:bg-gray-100"
    aria-label={label}
  >
    {icon}
  </a>
);

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gradient-light mt-auto">
      <div className="w-full px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {/* Links Section - Bottom Left Corner */}
          <div className="flex flex-wrap items-center gap-4">
            <FooterLink href="/?fromNav=true">About</FooterLink>
            <FooterLink href="https://docs.pinto.money/disclosures" external>
              Terms of Service
            </FooterLink>
            <FooterLink href="https://pinto.exchange/" external className="flex items-center gap-1.5">
              <IconImage src="/assets/misc/pinto-exchange-logo.svg" alt="Pinto Exchange" width={12} height={12} />
              Exchange
            </FooterLink>
          </div>

          {/* Social Icons Section - Bottom Right Corner */}
          <div className="flex items-center gap-1 sm:ml-auto">
            <SocialIcon
              href="https://pinto.money/discord"
              icon={<DiscordLogoIcon width={16} height={16} />}
              label="Discord"
            />
            <SocialIcon
              href="https://x.com/pintodotmoney"
              icon={<TwitterLogoIcon width={16} height={16} />}
              label="X (Twitter)"
            />
            <SocialIcon
              href="https://github.com/pinto-org"
              icon={<GitHubLogoIcon width={16} height={16} />}
              label="GitHub"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
