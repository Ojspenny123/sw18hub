import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { getEvents } from "@/lib/contentful";
import PageView from "@/components/PageView";
import { getPage, pageMetadata } from "@/lib/pages";
import { abs } from "@/lib/seo";

export const revalidate = 300;


export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getPage("whats-on"), "/whats-on");
}

export default async function WhatsOnPage({ searchParams }: { searchParams: Promise<{ day?: string }> }) {
  const { day } = await searchParams;
  const events = await getEvents();

  return (
    <PageView page={await getPage("whats-on")} params={{ day }}>
      <JsonLd
        data={events.slice(0, 30).map((e) => ({
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
