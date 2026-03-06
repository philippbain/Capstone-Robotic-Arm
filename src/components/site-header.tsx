import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand">
          Capstone Robotic Arm
        </Link>
        <nav className="site-nav">
          <Link href="/">Project Story</Link>
          <Link href="/about">About Team</Link>
        </nav>
      </div>
    </header>
  );
}
