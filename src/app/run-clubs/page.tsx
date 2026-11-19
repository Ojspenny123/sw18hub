import type { Metadata } from "next";
import Link from "next/link";
import RunClubs from "@/components/RunClubs";

export const metadata: Metadata = {
  title: "Run clubs in SW18: Wandsworth, Earlsfield, Southfields and nearby",
  description: "Free and friendly run clubs in and around SW18, with when and where they meet and a link to each club.",
  alternates: { canonical: "/run-clubs" },
};

export default function RunClubsPage() {
  return (
    <div className="wrap section" style={{ paddingTop: 24 }}>
      <h1 className="title">Run clubs in SW18</h1>
      <p className="muted" style={{ margin: "8px 0 20px" }}>
        Weekly run clubs in Wandsworth and nearby. Looking for parkrun? See <Link href="/whats-on">What&apos;s on</Link>.
      </p>
      <RunClubs />
    </div>
  );
}
