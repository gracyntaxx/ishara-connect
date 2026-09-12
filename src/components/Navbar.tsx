import { Link, useLocation } from "@tanstack/react-router";
import { useAuthStore, useSettingsStore } from "../stores";
import { useState } from "react";
import { Menu, X, LogOut } from "lucide-react";

export function Navbar() {
  const { highContrast, toggleHighContrast } = useSettingsStore();
  const { user, isGuest, getDisplayName, logout } = useAuthStore();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/room", label: "Video Call" },
    { href: "/learn", label: "Learn" },
    { href: "/awareness", label: "Awareness" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/guide", label: "Guide" },
    { href: "/settings", label: "Settings" },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-[#e8eaed]">
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between px-6 h-16"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2" aria-label="Ishara Home">
          <img src="/ishara-logo.png" alt="Ishara Connect" className="h-10 w-auto object-contain" />
        </Link>


        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? "text-[#3b82f6] bg-[#eff6ff]"
                  : "text-[#5f6368] hover:text-[#202124] hover:bg-[#f1f3f4]"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleHighContrast}
            className={`hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
              highContrast ? "bg-[#0f172a] text-white" : "text-[#5f6368] hover:bg-[#f1f3f4]"
            }`}
            aria-label={highContrast ? "Disable high contrast" : "Enable high contrast"}
            title="High contrast"
          >
            <svg
              className="h-[18px] w-[18px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 18a6 6 0 0 0 0-12v12z" />
            </svg>
          </button>

          {user && !isGuest ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#3b82f6] text-white flex items-center justify-center text-sm font-medium">
                {getDisplayName().charAt(0).toUpperCase()}
              </div>
              <button
                onClick={logout}
                className="hidden sm:inline-flex items-center gap-1.5 text-sm text-[#5f6368] hover:text-[#202124] transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-[#3b82f6] hover:bg-[#eff6ff] rounded-full transition-colors"
            >
              Sign in
            </Link>
          )}

          <Link
            to="/room"
            className="inline-flex items-center px-5 py-2 text-sm font-medium text-white bg-[#3b82f6] hover:bg-[#2563eb] rounded-full transition-colors shadow-sm"
          >
            Start Call
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-full hover:bg-[#f1f3f4] text-[#5f6368]"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#e8eaed] bg-white px-6 py-4 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${
                isActive(link.href)
                  ? "text-[#3b82f6] bg-[#eff6ff]"
                  : "text-[#5f6368] hover:bg-[#f1f3f4]"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {!user && (
            <Link
              to="/auth"
              onClick={() => setMobileOpen(false)}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-[#3b82f6]"
            >
              Sign in
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
