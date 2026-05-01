export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div
        className="w-7 h-7 rounded-full border-2 border-transparent animate-spin"
        style={{ borderTopColor: "var(--accent)", borderRightColor: "var(--accent)" }}
      />
    </div>
  );
}
