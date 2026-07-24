// Skeleton global untuk grup (app): tampil seketika saat pindah menu sehingga
// navigasi terasa ringan meski data halaman masih dimuat dari server.
export default function Loading() {
  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-pulse" aria-busy="true">
      <div className="space-y-2">
        <div className="h-7 w-56 bg-slate-200 rounded" />
        <div className="h-4 w-80 bg-slate-100 rounded" />
      </div>
      <div className="h-20 bg-slate-100 rounded-lg" />
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
        <div className="h-5 w-64 bg-slate-200 rounded" />
        <div className="h-4 w-full bg-slate-100 rounded" />
        <div className="h-4 w-full bg-slate-100 rounded" />
        <div className="h-4 w-3/4 bg-slate-100 rounded" />
        <div className="h-4 w-full bg-slate-100 rounded" />
        <div className="h-4 w-2/3 bg-slate-100 rounded" />
      </div>
    </div>
  );
}
