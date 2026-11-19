import type { Metadata } from "next";
import PageView from "@/components/PageView";
import { getPage, pageMetadata } from "@/lib/pages";

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const { openGraph, twitter, ...meta } = pageMetadata(await getPage("home"), "/", true);
  void openGraph;
  void twitter;
  return meta;
}

export default async function Home() {
  return <PageView page={await getPage("home")} home />;
}
