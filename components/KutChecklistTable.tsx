import { KUT_CHECKLIST_ITEMS, type KutChecklist } from "@/lib/kutChecklist";
import { Check } from "lucide-react";

/**
 * Tabel resmi "CHECK LIST BERKAS SYARAT UNTUK MENDAFTAR UJIAN TESIS"
 * dengan kolom NO | BERKAS | ADA | TIDAK ADA (read-only).
 */
export function KutChecklistTable({
  checklist,
  mahasiswa,
}: {
  checklist: KutChecklist;
  mahasiswa?: { name: string; nimNip: string; prodi: string | null };
}) {
  return (
    <div className="bg-white text-slate-900">
      <div className="text-center mb-3">
        <h4 className="text-sm font-bold uppercase text-balance">
          Check List Berkas Syarat untuk Mendaftar Ujian Tesis
        </h4>
        <p className="text-xs font-semibold uppercase">
          Program Pascasarjana UM Metro
        </p>
      </div>
      {mahasiswa && (
        <div className="text-sm space-y-0.5 mb-3">
          <div className="grid grid-cols-[110px_10px_1fr]">
            <span>Nama</span>
            <span>:</span>
            <span>{mahasiswa.name}</span>
          </div>
          <div className="grid grid-cols-[110px_10px_1fr]">
            <span>NPM</span>
            <span>:</span>
            <span>{mahasiswa.nimNip}</span>
          </div>
          <div className="grid grid-cols-[110px_10px_1fr]">
            <span>Program Studi</span>
            <span>:</span>
            <span>{mahasiswa.prodi || "-"}</span>
          </div>
        </div>
      )}
      <table className="w-full border-collapse text-sm [&_th]:border [&_th]:border-slate-800 [&_th]:p-1.5 [&_td]:border [&_td]:border-slate-800 [&_td]:p-1.5 [&_td]:align-top">
        <thead>
          <tr className="text-center">
            <th className="w-10">NO</th>
            <th>BERKAS</th>
            <th className="w-14">ADA</th>
            <th className="w-20">TIDAK ADA</th>
          </tr>
        </thead>
        <tbody>
          {KUT_CHECKLIST_ITEMS.map((item, i) => (
            <tr key={i}>
              <td className="text-center">{i + 1}</td>
              <td>{item}</td>
              <td className="text-center">
                {checklist[i] && (
                  <Check
                    className="w-4 h-4 inline-block"
                    aria-label="Ada"
                  />
                )}
              </td>
              <td className="text-center">
                {!checklist[i] && (
                  <Check
                    className="w-4 h-4 inline-block"
                    aria-label="Tidak ada"
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
