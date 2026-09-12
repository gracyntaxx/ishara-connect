import { createFileRoute } from "@tanstack/react-router";
import { Navbar, Footer, Practice } from "../components";

export const Route = createFileRoute("/practice")({
  component: PracticePage,
});

function PracticePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Practice />
      </main>
      <Footer />
    </div>
  );
}
