import type { Metadata } from "next";
import { getEvents } from "@/lib/contentful";
import JsonLd from "@/components/JsonLd";
import PageView from "@/components/PageView";
import { getPage, pageMetadata } from "@/lib/pages";
import { abs } from "@/lib/seo";
export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getPage("news"), "/news");
}

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ topic?: string; area?: string }> }) {
  const { topic, area } = await searchParams;
  const events = await getEvents();
  return (
    <PageView page={await getPage("news")} params={{ topic, area }}>
      <JsonLd
        data={events.slice(0, 20).map((e) => ({
          "@context": "https://schema.org",
          "@type": "Event",
          name: e.title,
          startDate: e.startsAt,
          ...(e.endsAt ? { endDate: e.endsAt } : {}),
          ...(e.description ? { description: e.description } : {}),
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
          location: { "@type": "Place", name: e.venueName ?? "SW18", address: { "@type": "PostalAddress", addressLocality: "London", addressCountry: "GB" } },
          url: e.link ?? abs("/whats-on"),
        }))}
      />
    </PageView>
  );
}
