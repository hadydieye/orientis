const blobs = [
  {
    left: "20%",
    top: "20%",
    color: "var(--secondary)",
    fadeAt: "38%",
    animate: "animate-aurora-a",
  },
  {
    left: "80%",
    top: "30%",
    color: "var(--accent)",
    fadeAt: "35%",
    animate: "animate-aurora-b",
  },
  {
    left: "50%",
    top: "90%",
    color: "var(--primary)",
    fadeAt: "40%",
    animate: "animate-aurora-c",
  },
];

export function AuroraBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      {blobs.map((blob, i) => (
        <div
          key={i}
          className={`absolute h-[70vmax] w-[70vmax] rounded-full opacity-[0.15] blur-3xl will-change-transform ${blob.animate}`}
          style={{
            left: blob.left,
            top: blob.top,
            background: `radial-gradient(circle at center, ${blob.color} 0%, transparent ${blob.fadeAt})`,
          }}
        />
      ))}
    </div>
  );
}
