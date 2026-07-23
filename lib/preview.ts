// Helper pratinjau berkas.
//
// Dokumen Word tidak bisa dirender langsung oleh browser — iframe/tautan
// langsung akan mengunduh berkas. Karena berkas disimpan sebagai URL publik
// di Supabase Storage, URL-nya dibungkus lewat viewer Office Online agar
// dosen dapat melihat isi dokumen tanpa mengunduh.

const OFFICE_VIEWER_BASE =
  "https://view.officeapps.live.com/op/embed.aspx?src=";

export function isWordFile(nameOrUrl: string): boolean {
  return /\.(doc|docx)(\?.*)?$/i.test(nameOrUrl);
}

export function officeViewerUrl(url: string): string {
  return OFFICE_VIEWER_BASE + encodeURIComponent(url);
}

// URL siap-pratinjau: Word lewat Office Online; PDF/gambar bisa langsung.
export function previewUrl(url: string, name?: string | null): string {
  return isWordFile(name || url) ? officeViewerUrl(url) : url;
}
