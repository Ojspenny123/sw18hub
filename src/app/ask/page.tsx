import type { Metadata } from "next";
import Chat from "@/components/Chat";

export const metadata: Metadata = {
  title: "Ask SW18",
  description: "Ask a question about places to eat and drink, news, events and deals in Wandsworth, Earlsfield and Southfields.",
  alternates: { canonical: "/ask" },
  openGraph: { title: "Ask SW18", description: "Ask a question about places to eat and drink, news, events and deals in Wandsworth, Earlsfield and Southfields.", url: "/ask", type: "website", siteName: "SW18 Hub", locale: "en_GB" },
  twitter: { card: "summary_large_image", title: "Ask SW18", description: "Ask a question about places to eat and drink, news, events and deals in Wandsworth, Earlsfield and Southfields." },
};

export default async function AskPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return (
    <div className="wrap section" style={{ paddingTop: 24 }}>
      <h1 className="title">Ask SW18</h1>
      <Chat initialQuestion={q?.slice(0, 400)} />
    </div>
  );
}
