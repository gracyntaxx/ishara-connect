import { Link } from "@tanstack/react-router";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[#e8eaed] bg-white">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
          {/* Brand */}
          <div className="max-w-xs">
            <Link to="/" className="flex items-center gap-2" aria-label="Ishara Home">
              <img src="/ishara-mark.svg" alt="" className="h-6 w-6" />
              <span className="text-[16px] font-semibold text-[#202124]">ishara</span>
            </Link>
            <p className="mt-3 text-sm text-[#5f6368] leading-relaxed">
              Accessible sign language video calls. Client-side recognition, peer-to-peer
              connectivity, zero cloud processing.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-3 gap-8 text-sm">
            <div>
              <h4 className="font-medium text-[#202124] mb-3">Product</h4>
              <ul className="space-y-2">
                <li><Link to="/room" className="text-[#5f6368] hover:text-[#3b82f6] transition-colors">Start Call</Link></li>
                <li><Link to="/practice" className="text-[#5f6368] hover:text-[#3b82f6] transition-colors">Practice</Link></li>
                <li><Link to="/leaderboard" className="text-[#5f6368] hover:text-[#3b82f6] transition-colors">Leaderboard</Link></li>
                <li><Link to="/guide" className="text-[#5f6368] hover:text-[#3b82f6] transition-colors">Guide</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-[#202124] mb-3">About</h4>
              <ul className="space-y-2">
                <li><Link to="/about" className="text-[#5f6368] hover:text-[#3b82f6] transition-colors">About</Link></li>
                <li><Link to="/privacy" className="text-[#5f6368] hover:text-[#3b82f6] transition-colors">Privacy</Link></li>
                <li><Link to="/accessibility" className="text-[#5f6368] hover:text-[#3b82f6] transition-colors">Accessibility</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-[#202124] mb-3">Account</h4>
              <ul className="space-y-2">
                <li><Link to="/auth" className="text-[#5f6368] hover:text-[#3b82f6] transition-colors">Sign in</Link></li>
                <li><Link to="/settings" className="text-[#5f6368] hover:text-[#3b82f6] transition-colors">Settings</Link></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#e8eaed] flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-[#80868b]">© {year} Ishara. Built for accessibility.</p>
          <div className="flex items-center gap-4 text-xs text-[#80868b]">
            <Link to="/privacy" className="hover:text-[#5f6368] transition-colors">Privacy</Link>
            <Link to="/accessibility" className="hover:text-[#5f6368] transition-colors">Accessibility</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
