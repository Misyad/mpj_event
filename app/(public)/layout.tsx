/**
 * Layout untuk semua halaman PUBLIK (bukan admin).
 * Menerapkan konstrain lebar mobile (max 430px) sesuai PRD.
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[430px] min-h-screen bg-[#f0f4f0]">
      {children}
    </div>
  )
}
