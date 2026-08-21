export default function Loader({ label = "Loading" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-ink/50">
      <div className="w-8 h-8 rounded-full border-2 border-violet-200 border-t-violet-500 animate-spin" />
      <span className="text-sm font-medium">{label}…</span>
    </div>
  );
}
