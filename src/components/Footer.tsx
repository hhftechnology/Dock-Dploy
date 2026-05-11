import { BrandMark } from "./BrandMark";

interface FooterCol {
  heading: string;
  links: { label: string; href: string }[];
}

const COLS: FooterCol[] = [
  {
    heading: "Product",
    links: [
      { label: "Compose Builder", href: "/docker/compose-builder" },
      { label: "Config Builder", href: "/config-builder" },
      { label: "Scheduler", href: "/scheduler-builder" },
      { label: "Templates", href: "/" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Documentation", href: "https://github.com/hhftechnologies/Dock-Dploy#readme" },
      { label: "Changelog", href: "https://github.com/hhftechnologies/Dock-Dploy/releases" },
      { label: "Roadmap", href: "https://github.com/hhftechnologies/Dock-Dploy/issues" },
    ],
  },
  {
    heading: "Community",
    links: [
      { label: "GitHub", href: "https://github.com/hhftechnologies/Dock-Dploy" },
      { label: "Discord", href: "https://discord.gg/" },
      { label: "Contribute", href: "https://github.com/hhftechnologies/Dock-Dploy/blob/main/CONTRIBUTING.md" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "License (AGPL-3.0)", href: "https://www.gnu.org/licenses/agpl-3.0.txt" },
      { label: "Privacy", href: "/" },
      { label: "Terms", href: "/" },
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="app-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <BrandMark size={28} tone="on-dark" />
          <div>
            <span className="footer-name">
              Dock<span className="brand-dot">·</span>Dploy
            </span>
            <p className="footer-sub">
              A friendlier surface for Docker Compose, configs, and schedulers.
              Open source under AGPL-3.0.
            </p>
          </div>
        </div>
        <div className="footer-cols">
          {COLS.map((col) => (
            <div key={col.heading} className="footer-col">
              <div className="footer-col-h">{col.heading}</div>
              <ul>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={link.href.startsWith("http") ? "_blank" : undefined}
                      rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="footer-rule" />
      <div className="footer-bottom">
        <span>© {year} Dock-Dploy · HHF Technology</span>
        <span className="footer-mono">v0.1.0 · AGPL-3.0</span>
      </div>
    </footer>
  );
}
