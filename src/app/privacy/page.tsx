import type { Metadata } from "next";
import Link from "next/link";
import CookieSettings from "@/components/CookieSettings";

export const metadata: Metadata = {
  title: "Privacy and cookies",
  description: "How SW18 Hub uses cookies and Google Analytics, and how to change your choice.",
  alternates: { canonical: "/privacy" },
  openGraph: { title: "Privacy and cookies", description: "How SW18 Hub uses cookies and Google Analytics, and how to change your choice.", url: "/privacy", type: "website", siteName: "SW18 Hub", locale: "en_GB" },
  twitter: { card: "summary_large_image", title: "Privacy and cookies", description: "How SW18 Hub uses cookies and Google Analytics, and how to change your choice." },
};

export default function PrivacyPage() {
  return (
    <div className="wrap section" style={{ paddingTop: 24 }}>
      <h1 className="title">Privacy and cookies</h1>
      <div className="prose">
        <p>SW18 Hub is a local guide. We want to know which pages and links are useful, and nothing more.</p>
        <h2>Analytics</h2>
        <p>If you accept, we use Google Analytics 4 to count page views, clicks on links that leave the site, map and chatbot use. Google sets cookies on your device to do this (named _ga and _ga_ followed by letters). We switch off Google&apos;s advertising features and do not use the data for ads. If you decline, nothing is loaded and no analytics cookies are set.</p>
        <h2>Ask SW18 chatbot</h2>
        <p>If you accept analytics, we record how many questions are asked and the first 100 characters of each question, so we can see what people want to know. Email addresses and phone numbers are removed first, but please do not put personal details in questions. Questions are also sent to Anthropic to produce the answer. If you decline analytics, none of this goes to Google.</p>
        <h2>Other things you might send us</h2>
        <p>If you use the forms to add your business or suggest a place, we receive the details you type in and use them only to reply to you.</p>
        <h2>Change your choice</h2>
        <p><CookieSettings /> shows the banner again so you can accept or decline. You can also clear cookies in your browser at any time.</p>
        <p><Link href="/about">About SW18 Hub</Link></p>
      </div>
    </div>
  );
}
