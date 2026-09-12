import { Link } from "@tanstack/react-router";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Product: [
      { href: "/room", label: "Start Call", external: false },
      { href: "/practice", label: "Practice Mode", external: false },
      { href: "/leaderboard", label: "Leaderboard", external: false },
    ],
    Company: [
      { href: "/about", label: "About", external: false },
      { href: "/privacy", label: "Privacy", external: false },
      { href: "/accessibility", label: "Accessibility", external: false },
    ],
    Resources: [
      { href: "/settings", label: "Settings", external: false },
      { href: "https://github.com", label: "GitHub", external: true },
      { href: "https://twitter.com", label: "Twitter", external: true },
    ],
  };

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2" aria-label="Ishara Connect Home">
              <img src="/ishara-mark.svg" alt="" className="h-8 w-8" />
              <span className="text-xl font-bold text-foreground">Ishara</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-xs">
              Accessible sign language video calls powered by real-time AI recognition. Bridging
              communication between Deaf and hearing communities.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-foreground">{category}</h3>
              <ul className="mt-4 space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-primary"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {currentYear} Ishara Connect. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link
              to="/privacy"
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Privacy Policy
            </Link>
            <Link
              to="/accessibility"
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              Accessibility
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
