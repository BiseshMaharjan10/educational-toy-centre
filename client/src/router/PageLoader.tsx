export default function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f6eee4] text-[#3d2b1f]">
      <div className="flex flex-col items-center gap-4">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#d8b08e] border-t-[#8f2a22]" />
        <p className="text-[0.72rem] uppercase tracking-[0.28em]">Loading...</p>
      </div>
    </div>
  )
}