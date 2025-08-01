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
    "flex items-center gap-1.5 text-gray-600 hover:text-pinto-green-4 transition-colors duration-200 text-sm font-medium",
    className,
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={linkClasses}>
        {children}
        <ExternalLinkIcon width={12} height={12} color="currentColor" />
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
    className="p-2 text-gray-600 hover:text-pinto-green-4 transition-colors duration-200 rounded-md hover:bg-gray-50"
    aria-label={label}
  >
    {icon}
  </a>
);

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Links Section */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
            <FooterLink href="/?fromNav=true">About</FooterLink>
            <FooterLink href="https://docs.pinto.money/disclosures" external>
              Terms of Service
            </FooterLink>
            <FooterLink href="https://pinto.exchange/" external className="flex items-center gap-2">
              <IconImage src="/assets/misc/pinto-exchange-logo.svg" alt="Pinto Exchange" width={16} height={16} />
              Exchange
            </FooterLink>
          </div>

          {/* Social Icons Section */}
          <div className="flex items-center gap-2">
            <SocialIcon
              href="https://pinto.money/discord"
              icon={<DiscordLogoIcon width={20} height={20} />}
              label="Discord"
            />
            <SocialIcon
              href="https://x.com/pintocommunity"
              icon={<TwitterLogoIcon width={20} height={20} />}
              label="X (Twitter)"
            />
            <SocialIcon
              href="https://github.com/pinto-org"
              icon={<GitHubLogoIcon width={20} height={20} />}
              label="GitHub"
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
