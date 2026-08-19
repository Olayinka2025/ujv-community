import { useEffect, useRef, useState } from "react";
import { Phone, PhoneOff, Video } from "lucide-react";
import { Avatar } from "./Avatar";
import { useAuth } from "@/lib/auth";
import { useMyActiveCall, useRespondToCall, type ActiveCall } from "@/lib/hooks/useCalls";

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (domain: string, options: Record<string, unknown>) => JitsiMeetAPI;
  }
}

type JitsiMeetAPI = { dispose: () => void };

let jitsiScriptPromise: Promise<void> | null = null;

function loadJitsiScript(): Promise<void> {
  if (window.JitsiMeetExternalAPI) return Promise.resolve();
  if (!jitsiScriptPromise) {
    jitsiScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://meet.jit.si/external_api.js";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Jitsi"));
      document.head.appendChild(script);
    });
  }
  return jitsiScriptPromise;
}

/** A couple of oscillator tones on a loop — no audio asset needed. */
function useRingtone(playing: boolean) {
  useEffect(() => {
    if (!playing) return;
    const ctx = new AudioContext();
    let cancelled = false;

    const ring = () => {
      if (cancelled) return;
      [523.25, 659.25].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = freq;
        gain.gain.value = 0.05;
        osc.connect(gain).connect(ctx.destination);
        const start = ctx.currentTime + i * 0.15;
        osc.start(start);
        osc.stop(start + 0.15);
      });
    };

    ring();
    const interval = setInterval(ring, 1500);
    return () => {
      cancelled = true;
      clearInterval(interval);
      void ctx.close();
    };
  }, [playing]);
}

function ActiveCallView({ call, onHangUp }: { call: ActiveCall; onHangUp: () => void }) {
  const { profile } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<JitsiMeetAPI | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadJitsiScript().then(() => {
      if (cancelled || !containerRef.current || !window.JitsiMeetExternalAPI) return;
      apiRef.current = new window.JitsiMeetExternalAPI("meet.jit.si", {
        roomName: call.roomName,
        parentNode: containerRef.current,
        width: "100%",
        height: "100%",
        configOverwrite: {
          startAudioOnly: call.kind === "audio",
          prejoinPageEnabled: false,
        },
        userInfo: { displayName: profile?.name ?? "UJV member" },
      });
    });
    return () => {
      cancelled = true;
      apiRef.current?.dispose();
      apiRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call.roomName, call.kind]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black">
      <div ref={containerRef} className="min-h-0 flex-1" />
      <button
        type="button"
        onClick={onHangUp}
        aria-label="Hang up"
        className="absolute bottom-6 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg transition-opacity hover:opacity-90"
      >
        <PhoneOff className="h-6 w-6" />
      </button>
    </div>
  );
}

export function CallOverlay() {
  const { user } = useAuth();
  const { data: call } = useMyActiveCall();
  const respond = useRespondToCall();
  const [cancelledLocally, setCancelledLocally] = useState<string | null>(null);

  const isCaller = call?.callerId === user?.id;
  const isRinging = call?.status === "ringing";
  const otherName = call ? (isCaller ? call.calleeName : call.callerName) : "";

  useRingtone(Boolean(call && isRinging));

  useEffect(() => {
    if (!call || !isRinging || !isCaller) return;
    const timeout = setTimeout(() => {
      respond.mutate({ callId: call.id, status: "missed" });
    }, 45_000);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call?.id, isRinging, isCaller]);

  if (!call || call.id === cancelledLocally) return null;

  if (call.status === "active") {
    return (
      <ActiveCallView
        call={call}
        onHangUp={() => respond.mutate({ callId: call.id, status: "ended" })}
      />
    );
  }

  if (!isRinging) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6 bg-foreground/90 text-background">
      <span className="animate-pulse">
        <Avatar name={otherName} size={96} />
      </span>
      <div className="text-center">
        <p className="text-xl font-semibold">{otherName}</p>
        <p className="mt-1 text-sm opacity-70">
          {isCaller
            ? `Calling… (${call.kind === "audio" ? "voice" : "video"})`
            : `Incoming ${call.kind === "audio" ? "voice" : "video"} call`}
        </p>
      </div>
      <div className="flex items-center gap-6">
        <button
          type="button"
          aria-label={isCaller ? "Cancel call" : "Decline call"}
          onClick={() => {
            if (isCaller) setCancelledLocally(call.id);
            respond.mutate({ callId: call.id, status: isCaller ? "ended" : "declined" });
          }}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive text-destructive-foreground transition-opacity hover:opacity-90"
        >
          <PhoneOff className="h-6 w-6" />
        </button>
        {!isCaller ? (
          <button
            type="button"
            aria-label="Accept call"
            onClick={() => respond.mutate({ callId: call.id, status: "active" })}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-green-600 text-white transition-opacity hover:opacity-90"
          >
            {call.kind === "audio" ? <Phone className="h-6 w-6" /> : <Video className="h-6 w-6" />}
          </button>
        ) : null}
      </div>
    </div>
  );
}
