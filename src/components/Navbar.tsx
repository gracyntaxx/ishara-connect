import { Link, useLocation } from "@tanstack/react-router";
import { useSettingsStore } from "../stores";

export function Navbar() {
  const { highContrast, toggleHighContrast, theme, setTheme } = useSettingsStore();
  const location = useLocation();

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/room", label: "Start Call" },
    { href: "/practice", label: "Practice" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        <Link to="/" className="flex items-center gap-2" aria-label="Ishara Connect Home">
          <img src="/ishara-mark.svg" alt="" className="h-8 w-8" />
          <span className="text-xl font-bold text-foreground">Ishara</span>
        </Link>

        <div className="hidden md:flex md:items-center md:gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === link.href ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleHighContrast}
            className={`inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              highContrast
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/10 text-secondary hover:bg-secondary/20"
            }`}
            aria-pressed={highContrast}
            aria-label={highContrast ? "Disable high contrast" : "Enable high contrast"}
          >
            <svg
              className="h-4 w-4 mr-1"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 18a6 6 0 0 0 0-12v12z" />
            </svg>
            Contrast
          </button>

          <div className="hidden sm:flex items-center gap-2 border-l border-border pl-3">
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as "light" | "dark" | "system")}
              className="text-sm bg-background border border-input rounded-md px-2 py-1"
              aria-label="Theme"
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <Link
            to="/room"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Start Call
          </Link>
        </div>
      </nav>
    </header>
  );
}
