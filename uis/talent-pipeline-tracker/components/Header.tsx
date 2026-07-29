import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-[100] flex items-center justify-between gap-4 border-b border-[rgba(16,16,16,0.06)] bg-[rgba(255,250,243,0.82)] px-[5%] py-[18px] backdrop-blur-[14px] md:px-[8%]">
      <Link
        href="/"
        className="font-[family-name:var(--font-space-grotesk)] text-[1.55rem] font-bold tracking-[-0.04em] text-[#101010]"
      >
        Health<span className="text-[#ff6a3d]">Core</span>
      </Link>
      <p className="font-semibold text-[#5f5a54]">People &amp; Talent</p>
    </header>
  );
}