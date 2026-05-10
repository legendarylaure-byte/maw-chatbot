"use client";

export function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="glass rounded-2xl px-4 py-3 rounded-bl-md">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 bg-[#cf107a] rounded-full animate-bounce" style={{ animationDelay: "0s", animationDuration: "1s" }} />
          <span className="w-2 h-2 bg-[#9227a0] rounded-full animate-bounce" style={{ animationDelay: "0.2s", animationDuration: "1s" }} />
          <span className="w-2 h-2 bg-[#1457ee] rounded-full animate-bounce" style={{ animationDelay: "0.4s", animationDuration: "1s" }} />
        </div>
      </div>
    </div>
  );
}
