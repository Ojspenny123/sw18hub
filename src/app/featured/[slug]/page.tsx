import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPopupPage } from "@/lib/contentful";

export const revalidate = 300;

/** Pages are built on first visit, then cached and refreshed. */
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getPopupPage(slug);
  if (!p) return { title: "Page not found", robots: { index: false } };
  return {
    title: p.heading,
    description: p.body.slice(0, 200),
    alternates: { canonical: `/featured/${p.slug}` },
    openGraph: { title: p.heading, description: p.body.slice(0, 200), url: `/featured/${p.slug}`, type: "website", ...(p.imageUrl ? { images: [p.imageUrl] } : {}) },
  };
}

export default async function FeaturedPage({ params }: Props) {
  const { slug } = await params;
  const p = await getPopupPage(slug);
  if (!p) notFound();
  const paragraphs = (p.pageText || p.body).split(/\n{2,}/).map((t) => t.trim()).filter(Boolean);

  return (
    <div className="wrap section featured">
      <p className="crumbs">
        <Link href="/whats-on">&larr; What&apos;s on</Link>
      </p>
      <h1 className="title">{p.heading}</h1>
      {p.detail ? <p className="popup-detail">{p.detail}</p> : null}
      {p.imageUrl ? (
        <figure className="featured-fig">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.imageUrl} alt={p.imageCredit ?? ""} width={960} height={540} />
        </figure>
      ) : null}
      {paragraphs.map((t, i) => (
        <p key={i}>{t}</p>
      ))}
      {p.linkUrl ? (
        <p>
          <a className="btn" href={p.linkUrl} target="_blank" rel="noopener noreferrer">
            {p.linkLabel || "Visit the website"}
          </a>
        </p>
      ) : null}
    </div>
  );
}
