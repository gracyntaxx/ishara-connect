import { createFileRoute } from "@tanstack/react-router";
import { useSearch } from "@tanstack/react-router";
import { VideoCall } from "../../components";

export const Route = createFileRoute("/call/$roomId")({
  component: Call,
});

function Call() {
  const search = useSearch({ from: "/call/$roomId" });
  const { roomId } = Route.useParams();

  const name = search.name || "Guest";
  const initiator = search.initiator === "true";
  const code = search.code;

  return (
    <div className="h-screen w-full">
      <VideoCall
        roomId={roomId}
        localName={name}
        isInitiator={initiator}
        remoteConnectionCode={code}
      />
    </div>
  );
}
