export function AnimatedBackground() {
  return (
    <div className="landing-bg pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="landing-bg-gradient absolute inset-0" />
      <div className="landing-blob landing-blob-1 absolute rounded-full" />
      <div className="landing-blob landing-blob-2 absolute rounded-full" />
      <div className="landing-blob landing-blob-3 absolute rounded-full" />
      <div className="landing-blob landing-blob-4 absolute rounded-full" />
      <div className="landing-sweep landing-sweep-1 absolute" />
      <div className="landing-sweep landing-sweep-2 absolute" />
      <div className="landing-sweep landing-sweep-3 absolute" />
      <div className="landing-dot landing-dot-1 absolute rounded-full" />
      <div className="landing-dot landing-dot-2 absolute rounded-full" />
      <div className="landing-dot landing-dot-3 absolute rounded-full" />
      <div className="landing-dot landing-dot-4 absolute rounded-full" />
      <div className="landing-dot landing-dot-5 absolute rounded-full" />
    </div>
  );
}
