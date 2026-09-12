/**
 * Signaling abstraction.
 *
 * Today Ishara ships `ManualSignaling`: the two participants copy and paste a
 * short connection code, so no server is involved at all. When the Express +
 * MongoDB backend exists, add an `HttpSignaling` implementation of the same
 * interface and the call/recognition/dialogue code stays untouched.
 */

export type SessionDescriptionPayload = {
  roomId: string;
  sdp: RTCSessionDescriptionInit;
  senderName: string;
};

export interface SignalingTransport {
  /** Publish the local offer/answer so the peer can pick it up. */
  publish(payload: SessionDescriptionPayload): Promise<string>;
  /** Consume a peer's offer/answer. */
  consume(code: string): Promise<SessionDescriptionPayload>;
}

function encode(payload: SessionDescriptionPayload): string {
  return btoa(encodeURIComponent(JSON.stringify(payload)));
}

function decode(code: string): SessionDescriptionPayload {
  return JSON.parse(decodeURIComponent(atob(code.trim())));
}

export class ManualSignaling implements SignalingTransport {
  async publish(payload: SessionDescriptionPayload): Promise<string> {
    return encode(payload);
  }

  async consume(code: string): Promise<SessionDescriptionPayload> {
    const payload = decode(code);
    if (!payload?.sdp?.type) throw new Error("That connection code isn't valid.");
    return payload;
  }
}

/**
 * FUTURE: drop-in replacement once the backend exists.
 *
 * export class HttpSignaling implements SignalingTransport {
 *   constructor(private baseUrl: string) {}
 *   async publish(payload) { ...POST /rooms/:id/sdp... }
 *   async consume(code) { ...GET /rooms/:id/sdp... }
 * }
 */

export type DataMessage = {
  type: "sign" | "speech" | "control";
  text: string;
  confidence?: number;
  isFinal?: boolean;
  timestamp: number;
  senderName?: string;
};
