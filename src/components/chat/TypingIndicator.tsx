"use client";

export function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="glass rounded-2xl rounded-bl-md px-4 py-3 border border-[var(--border-glass)]">
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full animate-bounce-dot"
                style={{
                  background: "var(--gradient-orb)",
                  animationDelay: `${i * 0.16}s`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
