import type { Metadata } from "next";
import PageView from "@/components/PageView";
import { getPage, pageMetadata } from "@/lib/pages";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata(await getPage("ask"), "/ask");
}

export default async function AskPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return <PageView page={await getPage("ask")} params={{ q }} />;
}
