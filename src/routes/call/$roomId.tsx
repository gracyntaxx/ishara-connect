import { createFileRoute } from "@tanstack/react-router";
import { useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { VideoCall, ZegoCall } from "../../components";

interface CallSearchParams {
  name?: string;
  initiator?: string;
  code?: string;
  engine?: "zego" | "p2p";
  gestures?: string;
}

export const Route = createFileRoute("/call/$roomId")({
  validateSearch: (search: Record<string, unknown>): CallSearchParams => {
    return {
      name: typeof search.name === "string" ? search.name : undefined,
      initiator: typeof search.initiator === "string" ? search.initiator : undefined,
      code: typeof search.code === "string" ? search.code : undefined,
      engine: search.engine === "p2p" ? "p2p" : "zego",
      gestures: search.gestures === "false" ? "false" : "true",
    };
  },
  component: Call,
});

function Call() {
  const search = useSearch({ from: "/call/$roomId" });
  const { roomId } = Route.useParams();

  const name = search.name || "User";
  const initiator = search.initiator === "true";
  const code = search.code;
  const initialGestures = search.gestures !== "false";

  const [activeEngine, setActiveEngine] = useState<"zego" | "p2p">(
    search.engine === "p2p" ? "p2p" : "zego"
  );

  return (
    <div className="h-screen w-full bg-[#1e1f20]">
      {activeEngine === "zego" ? (
        <ZegoCall
          roomId={roomId}
          localName={name}
          initialGestureMode={initialGestures}
          onSwitchToP2P={() => setActiveEngine("p2p")}
        />
      ) : (
        <div className="relative h-full w-full">
          <div className="absolute top-2 right-4 z-50">
            <button
              onClick={() => setActiveEngine("zego")}
              className="px-3 py-1.5 bg-[#1a73e8] text-white text-xs font-medium rounded-lg hover:bg-[#1557b0] shadow-md transition-colors"
            >
              Switch to ZEGOCLOUD HD Call
            </button>
          </div>
          <VideoCall
            roomId={roomId}
            localName={name}
            isInitiator={initiator}
            remoteConnectionCode={code}
          />
        </div>
      )}
    </div>
  );
}
