import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <span>SW18 Hub · A local guide to Wandsworth, Earlsfield and Southfields · Ratings and map data from Google</span>
        <nav aria-label="Footer">
          <Link href="/deals#business">Add your business</Link>
        </nav>
      </div>
    </footer>
  );
}
