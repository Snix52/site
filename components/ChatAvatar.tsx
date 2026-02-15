"use client";

type ChatAvatarProps = {
  imageUrl: string | null;
  username: string | null;
  frameType?: string | null;
  size?: number;
};

const FRAME_ASSET_BY_TYPE: Record<string, string> = {
  DARKIN: "/frames/darkin.png",
  IONIA: "/frames/ionia.png",
  HEXTECH: "/frames/hextech.png",
  BASIC: "/frames/basic.png",
  CHALLENGER: "/frames/challenger.png",
  SHADOW: "/frames/shadow.png",
  VOID: "/frames/void.png",
  FRELJORD: "/frames/freljord.png",
};

const AVATAR_SIZE_BY_TYPE: Record<string, string> = {
  DARKIN: "70%",
  IONIA: "76%",
  HEXTECH: "77%",
  BASIC: "80%",
  CHALLENGER: "71%",
  SHADOW: "68%",
  VOID: "69%",
  FRELJORD: "74%",
};

function getInitial(username: string | null) {
  const value = (username || "").trim();
  if (!value) return "?";
  return value[0].toUpperCase();
}

function getAnimationClass(frameType: string) {
  switch (frameType) {
    case "DARKIN":
      return "chat-frame-darkin";
    case "IONIA":
      return "chat-frame-ionia";
    case "HEXTECH":
      return "chat-frame-hextech";
    case "SHADOW":
      return "chat-frame-shadow";
    case "VOID":
      return "chat-frame-void";
    case "CHALLENGER":
      return "chat-frame-challenger";
    default:
      return "";
  }
}

export default function ChatAvatar({
  imageUrl,
  username,
  frameType = "BASIC",
  size = 42,
}: ChatAvatarProps) {
  const normalizedFrameType = String(frameType || "BASIC").toUpperCase();
  const frameUrl = FRAME_ASSET_BY_TYPE[normalizedFrameType] || FRAME_ASSET_BY_TYPE.BASIC;
  const avatarInset = AVATAR_SIZE_BY_TYPE[normalizedFrameType] || AVATAR_SIZE_BY_TYPE.BASIC;
  const animationClass = getAnimationClass(normalizedFrameType);
  const hasImage = Boolean(imageUrl && imageUrl.trim().length > 0);

  return (
    <div
      className="relative isolate shrink-0 overflow-visible"
      style={{ width: size, height: size }}
      title={!hasImage ? "Profil fotografi yok. Cerceve varsayilan avatar ile gosteriliyor." : undefined}
    >
      <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center">
        {normalizedFrameType === "DARKIN" && (
          <>
            <div className="absolute h-[80%] w-[80%] animate-pulse rounded-full bg-red-600/40 blur-xl" />
            <div
              className="absolute h-[60%] w-[60%] animate-ping rounded-full bg-red-900/60 blur-lg"
              style={{ animationDuration: "3s" }}
            />
          </>
        )}
        {normalizedFrameType === "IONIA" && (
          <>
            <div className="absolute h-[80%] w-[80%] animate-pulse rounded-full bg-cyan-400/30 blur-xl" />
            <div className="absolute h-[70%] w-[70%] animate-[pulse_4s_infinite_1s] rounded-full bg-pink-500/30 blur-2xl" />
          </>
        )}
        {normalizedFrameType === "HEXTECH" && (
          <>
            <div className="absolute h-[80%] w-[80%] rounded-full bg-blue-600/40 blur-xl shadow-[0_0_20px_rgba(37,99,235,0.6)]" />
            <div className="absolute h-[60%] w-[60%] animate-[ping_2s_linear_infinite] rounded-full border-2 border-blue-400/50" />
          </>
        )}
        {normalizedFrameType === "SHADOW" && (
          <>
            <div className="h-[80%] w-[80%] animate-pulse rounded-full bg-emerald-500/30 blur-xl" />
            <div className="absolute h-full w-full animate-[spin_10s_linear_infinite] bg-teal-900/20 blur-xl" />
          </>
        )}
        {normalizedFrameType === "VOID" && (
          <div className="h-[80%] w-[80%] animate-[pulse_2s_infinite] rounded-full bg-purple-700/50 blur-xl" />
        )}
        {normalizedFrameType === "CHALLENGER" && (
          <>
            <div className="absolute h-[80%] w-[80%] animate-pulse rounded-full bg-blue-600/50 blur-xl" />
            <div className="absolute h-[90%] w-[90%] animate-[spin_6s_linear_infinite] rounded-full bg-yellow-400/20 blur-2xl" />
          </>
        )}
        {normalizedFrameType === "FRELJORD" && (
          <div className="h-[80%] w-[80%] rounded-full bg-cyan-500/10 blur-xl" />
        )}
      </div>

      <div className={`relative z-10 h-full w-full ${animationClass}`}>
        <div
          className="absolute overflow-hidden rounded-full border border-black/40 bg-slate-800 shadow-inner"
          style={{
            width: avatarInset,
            height: avatarInset,
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          {hasImage ? (
            <img
              src={imageUrl || ""}
              alt={username || "Oyuncu"}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900 text-xs font-black text-white">
              {getInitial(username)}
            </div>
          )}
        </div>

        <img
          src={frameUrl}
          alt={`${normalizedFrameType} frame`}
          loading="lazy"
          decoding="async"
          className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-contain drop-shadow-[0_0_8px_rgba(0,0,0,0.35)]"
        />
      </div>

      <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-full">
        {normalizedFrameType === "HEXTECH" && (
          <div className="absolute inset-0 animate-pulse bg-blue-400/10 mix-blend-overlay" />
        )}
        {normalizedFrameType === "DARKIN" && (
          <div className="absolute inset-0 animate-pulse bg-red-500/10 mix-blend-overlay" />
        )}
        {normalizedFrameType === "SHADOW" && (
          <div className="absolute inset-0 animate-pulse bg-emerald-900/20 mix-blend-overlay" />
        )}
        {normalizedFrameType === "VOID" && (
          <div className="absolute inset-0 animate-pulse bg-fuchsia-900/20 mix-blend-overlay" />
        )}
        {normalizedFrameType === "CHALLENGER" && (
          <div className="absolute inset-0 animate-pulse bg-cyan-300/10 mix-blend-overlay" />
        )}
      </div>

      {!hasImage && (
        <div className="absolute -bottom-1 -right-1 z-30 flex h-4 w-4 items-center justify-center rounded-full border border-amber-300/50 bg-amber-500/90 text-[10px] font-black text-black">
          !
        </div>
      )}
    </div>
  );
}
