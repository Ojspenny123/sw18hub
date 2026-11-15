import type { Metadata } from "next";
import Chat from "@/components/Chat";

export const metadata: Metadata = { title: "Ask SW18" };

export default async function AskPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return (
    <div className="wrap section" style={{ paddingTop: 28 }}>
      <h1 className="title">Ask SW18</h1>
      <Chat initialQuestion={q?.slice(0, 500)} />
    </div>
  );
}
