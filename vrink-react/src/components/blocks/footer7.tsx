import Image from "next/image";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type FooterLink = {
  name: string;
  href: string;
};

type FooterSection = {
  title: string;
  links: FooterLink[];
};

type FooterSocialLink = {
  icon: ReactNode;
  href: string;
  label: string;
};

type FooterLogo = {
  url: string;
  src?: string;
  alt?: string;
  title: string;
};

interface Footer7Props {
  className?: string;
  logo?: FooterLogo;
  sections?: FooterSection[];
  description?: string;
  socialLinks?: FooterSocialLink[];
  copyright?: string;
  legalLinks?: FooterLink[];
}

const defaultSections: FooterSection[] = [
  {
    title: "Product",
    links: [
      { name: "FAQ", href: "#faq" },
      { name: "Contact", href: "#contact" },
      { name: "Gallery", href: "#reviews" },
      { name: "Pricing", href: "#pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { name: "About", href: "#" },
      { name: "Customers", href: "#" },
      { name: "Careers", href: "#" },
      { name: "Contact", href: "#contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { name: "Security", href: "#" },
      { name: "Privacy", href: "#" },
      { name: "Status", href: "#" },
      { name: "Help", href: "#" },
    ],
  },
];

const defaultSocialLinks: FooterSocialLink[] = [
  { icon: <Instagram className="size-5" />, href: "#", label: "Instagram" },
  { icon: <Facebook className="size-5" />, href: "#", label: "Facebook" },
  { icon: <Twitter className="size-5" />, href: "#", label: "Twitter" },
  { icon: <Linkedin className="size-5" />, href: "#", label: "LinkedIn" },
];

const defaultLegalLinks: FooterLink[] = [
  { name: "Terms and Conditions", href: "#" },
  { name: "Privacy Policy", href: "#" },
];

export function Footer7({
  className,
  logo = {
    url: "#",
    title: "NEUTRIX",
  },
  sections = defaultSections,
  description = "정밀한 자동화와 과학적 워크플로로 팀의 실행 속도를 끌어올리는 앱 운영 플랫폼.",
  socialLinks = defaultSocialLinks,
  copyright = `© ${new Date().getFullYear()} Neutrix. All rights reserved.`,
  legalLinks = defaultLegalLinks,
}: Footer7Props) {
  return (
    <footer className={cn("relative z-10 py-24 md:py-32", className)}>
      <div className="container mx-auto">
        <div className="flex w-full flex-col justify-between gap-10 lg:flex-row lg:items-start">
          <div className="flex w-full flex-col justify-between gap-6 lg:max-w-sm">
            <div className="flex items-center gap-2">
              <a href={logo.url} className="inline-flex items-center gap-2">
                {logo.src ? (
                  <Image src={logo.src} alt={logo.alt ?? "logo"} width={32} height={32} className="h-8 w-8 rounded-md" />
                ) : (
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-foreground text-xs font-bold text-background">
                    {logo.title.slice(0, 1)}
                  </span>
                )}
                <span className="text-xl font-semibold">{logo.title}</span>
              </a>
            </div>
            <p className="max-w-[70%] text-sm text-muted-foreground">{description}</p>
            <ul className="flex items-center space-x-6 text-muted-foreground">
              {socialLinks.map((social) => (
                <li key={social.label} className="font-medium hover:text-primary">
                  <a href={social.href} aria-label={social.label}>
                    {social.icon}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid w-full gap-6 md:grid-cols-3 lg:gap-20">
            {sections.map((section) => (
              <div key={section.title}>
                <h3 className="mb-4 font-bold">{section.title}</h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {section.links.map((link) => (
                    <li key={`${section.title}-${link.name}`} className="font-medium hover:text-primary">
                      <a href={link.href}>{link.name}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col justify-between gap-4 border-t py-8 text-xs font-medium text-muted-foreground md:flex-row md:items-center">
          <p className="order-2 md:order-1">{copyright}</p>
          <ul className="order-1 flex flex-col gap-2 md:order-2 md:flex-row">
            {legalLinks.map((link) => (
              <li key={link.name} className="hover:text-primary">
                <a href={link.href}>{link.name}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
