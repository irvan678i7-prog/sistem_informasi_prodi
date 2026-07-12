/**
 * Kop surat resmi Program Pascasarjana UM Metro,
 * meniru format formulir resmi (dokumen "format siprodi").
 */
export function FormKop() {
  return (
    <header className="mb-4">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-um-metro.png"
          alt="Logo Universitas Muhammadiyah Metro"
          className="w-16 h-16 object-contain shrink-0"
        />
        <div className="flex-1 text-center">
          <p className="text-sm font-bold uppercase leading-tight">
            Program Pascasarjana
          </p>
          <p className="text-lg font-bold uppercase leading-tight">
            Universitas Muhammadiyah Metro
          </p>
          <p className="text-[10px] leading-snug mt-1">
            Jl. Ki Hajar Dewantara No. 116 Iringmulyo Kota Metro, Telp/Fax
            (0725) 42445&ndash;42454, Kode Pos 34111
          </p>
          <p className="text-[10px] leading-snug">
            Laman: www.pascasarjana.ummetro.ac.id &mdash; Surel:
            pascasarjana@ummetro.ac.id
          </p>
        </div>
      </div>
      <div className="mt-2 border-t-4 border-blue-900" />
      <div className="mt-0.5 border-t border-blue-900" />
    </header>
  );
}
