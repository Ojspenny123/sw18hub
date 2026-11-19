import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import PageView from "@/components/PageView";
import { getPage, pageMetadata } from "@/lib/pages";
import { abs } from "@/lib/seo";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getPage("about"), "/about");
}

export default async function AboutPage() {
  return (
    <PageView page={await getPage("about")}>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          url: abs("/about"),
          name: "About SW18 Hub",
          about: { "@id": abs("/#org") },
        }}
      />
    </PageView>
  );
}
