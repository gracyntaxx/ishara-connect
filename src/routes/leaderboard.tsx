import { createFileRoute } from "@tanstack/react-router";
import { Navbar, Footer } from "../components";
import { Award, TrendingUp, Target, Download } from "lucide-react";
import { usePracticeStore } from "../stores";
import { SUPPORTED_SIGNS } from "../lib/constants";

export const Route = createFileRoute("/leaderboard")({
  component: Leaderboard,
});

function Leaderboard() {
  const { signStats, bestStreak, getAccuracy, getOverallAccuracy } = usePracticeStore();

  const mockLeaderboard = [
    { rank: 1, name: "Alex Chen", streak: 47, accuracy: 94.2, totalAttempts: 312 },
    { rank: 2, name: "Maria Santos", streak: 42, accuracy: 91.8, totalAttempts: 287 },
    { rank: 3, name: "James Wilson", streak: 38, accuracy: 89.5, totalAttempts: 245 },
    { rank: 4, name: "Sarah Kim", streak: 35, accuracy: 88.1, totalAttempts: 198 },
    { rank: 5, name: "David Park", streak: 31, accuracy: 86.7, totalAttempts: 167 },
  ];

  const yourStats = {
    rank: signStats ? (Object.values(signStats).some((s) => s.attempts > 0) ? 6 : null) : null,
    name: "You",
    streak: bestStreak,
    accuracy: getOverallAccuracy(),
    totalAttempts: Object.values(signStats || {}).reduce((sum, s) => sum + s.attempts, 0),
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 py-12 px-4">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">Leaderboard</h1>
            <p className="text-lg text-muted-foreground">
              Top practitioners this week. Practice more to climb the ranks!
            </p>
          </div>

          <div className="mb-8 p-4 bg-warning/10 border border-warning/20 rounded-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-warning" />
                <span className="font-medium text-foreground">Coming Soon with Backend</span>
              </div>
              <span className="text-xs text-muted-foreground">
                Leaderboard requires backend integration
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              This is a mock leaderboard. Connect a backend database to store and display real user
              rankings.
            </p>
          </div>

          <div className="space-y-6">
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-muted/50">
                <h2 className="text-lg font-semibold text-foreground">Weekly Top 5</h2>
              </div>
              <div className="divide-y divide-border">
                {mockLeaderboard.map((user) => (
                  <div
                    key={user.rank}
                    className="px-6 py-4 flex items-center gap-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                      {user.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{user.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {user.totalAttempts} attempts this week
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{user.streak} 🔥</p>
                      <p className="text-sm text-success">{user.accuracy.toFixed(1)}% accuracy</p>
                    </div>
                  </div>
                ))}
                {yourStats.rank && (
                  <div className="px-6 py-4 flex items-center gap-4 bg-primary/5 border-t border-border">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                      {yourStats.rank}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{yourStats.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {yourStats.totalAttempts} total attempts
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{yourStats.streak} 🔥</p>
                      <p className="text-sm text-success">
                        {yourStats.accuracy.toFixed(1)}% accuracy
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-border bg-muted/50">
                <h2 className="text-lg font-semibold text-foreground">Your Sign Accuracy</h2>
              </div>
              <div className="p-6">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {SUPPORTED_SIGNS.map((sign) => {
                    const accuracy = getAccuracy(sign);
                    const stat = signStats[sign];
                    return (
                      <div key={sign} className="p-4 rounded-lg border border-border bg-background">
                        <h3 className="font-medium text-foreground mb-2">{sign}</h3>
                        <div className="h-16 w-16 mx-auto mb-2 relative">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle
                              cx="8"
                              cy="8"
                              r="6"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                              className="text-muted"
                            />
                            <circle
                              cx="8"
                              cy="8"
                              r="6"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                              strokeDasharray={2 * Math.PI * 6}
                              strokeDashoffset={2 * Math.PI * 6 * (1 - accuracy / 100)}
                              strokeLinecap="round"
                              className={`transition-all duration-500 ${
                                accuracy >= 80
                                  ? "text-success"
                                  : accuracy >= 50
                                    ? "text-warning"
                                    : "text-destructive"
                              }`}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xl font-bold text-foreground">
                              {accuracy.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                          {stat.attempts} attempts • {stat.correct} correct
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="text-center">
              <button
                onClick={() => {
                  const data = { signStats, bestStreak, timestamp: Date.now() };
                  const blob = new Blob([JSON.stringify(data, null, 2)], {
                    type: "application/json",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `ishara-leaderboard-${new Date().toISOString().split("T")[0]}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 border border-input rounded-lg text-sm font-medium hover:bg-accent transition-colors"
              >
                <Download className="h-4 w-4" />
                Export My Data
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
