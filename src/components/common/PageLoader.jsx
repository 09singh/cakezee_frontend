function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--cream)]">
      <div className="flex flex-col items-center gap-3">
        <div
          className="
            h-8
            w-8
            animate-spin
            rounded-full
            border-2
            border-[var(--brand-light)]
            border-t-[var(--brand)]
          "
        />

        <span className="text-sm text-[var(--text-muted)]">
          Loading...
        </span>
      </div>
    </div>
  );
}

export default PageLoader;