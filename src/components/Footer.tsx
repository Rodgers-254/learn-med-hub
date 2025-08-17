// src/components/Footer.tsx
import React from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Stethoscope,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type FooterLink = { name: string; href: string };

const Footer: React.FC = () => {
  const footerSections: { title: string; links: FooterLink[] }[] = [
    {
      title: "Resources",
      links: [
        { name: "Medical Books", href: "#books" }, // anchor links
        { name: "Study Guides", href: "#guides" },
        { name: "Case Studies", href: "#cases" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "About", href: "/#about" }, // in-page anchor on homepage
        { name: "Privacy Policy", href: "/privacy-policy" },
        { name: "Terms of Service", href: "/terms" },
      ],
    },
  ];

  const socialLinks: { icon: React.ComponentType<any>; href: string; label: string }[] =
    [
      { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
      { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
      { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
      { icon: Youtube, href: "https://youtube.com", label: "YouTube" },
    ];

  const renderLink = (link: FooterLink) => {
    // If it's a hash anchor (starts with #), render <a href="#...">
    if (link.href.startsWith("#")) {
      return (
        <a
          href={link.href}
          className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
        >
          {link.name}
        </a>
      );
    }

    // If it's an in-page anchor on homepage like "/#about", render <a href="#about">
    if (link.href.startsWith("/#")) {
      return (
        <a
          href={link.href.slice(1)} // remove leading slash
          className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
        >
          {link.name}
        </a>
      );
    }

    // Otherwise, it's a SPA internal route
    if (link.href.startsWith("/")) {
      return (
        <RouterLink
          to={link.href}
          className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
        >
          {link.name}
        </RouterLink>
      );
    }

    // Otherwise, external link fallback (rare here)
    return (
      <a
        href={link.href}
        className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
        target="_blank"
        rel="noopener noreferrer"
      >
        {link.name}
      </a>
    );
  };

  return (
    <footer className="bg-card border-t">
      <div className="container px-4 py-16">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-glow">
                <Stethoscope className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-foreground">MedBooks</span>
                <span className="text-xs text-muted-foreground">
                  Digital Medical Library
                </span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Empowering medical professionals with comprehensive digital resources
              and expert knowledge from Dr. Ogindo, MD - Gynecologist & Obstetrician
              (Gatehouse 1st floor, Nakuru, Kenya).
            </p>

            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>jogindo@gmail.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+254 116560425</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Nakuru, Kenya</span>
              </div>
            </div>
          </div>

          {/* Link sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold text-foreground mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>{renderLink(link)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Stay Updated</h3>
              <p className="text-sm text-muted-foreground">
                Get notified about new medical books, video releases, and educational
                content.
              </p>
            </div>

            <div className="flex gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Button>Subscribe</Button>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 MedBooks. All rights reserved. Created by Dr. Ogindo, MD.
          </p>

          <div className="flex items-center gap-3">
            {socialLinks.map((social) => {
              const Icon = social.icon;
              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center h-9 w-9 rounded-md bg-muted hover:bg-primary hover:text-primary-foreground transition-colors duration-200"
                  aria-label={social.label}
                >
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
