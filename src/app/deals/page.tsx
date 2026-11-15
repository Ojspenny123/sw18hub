import type { Metadata } from "next";
import CopyCode from "@/components/CopyCode";
import LeadForm from "@/components/LeadForm";
import { getDeals } from "@/lib/contentful";
import { dateLong } from "@/lib/format";

export const revalidate = 60;

export const metadata: Metadata = { title: "Local deals" };

const STEPS = [
  ["Apply and get verified", "Tell us about your business. We check it is a real SW18 business."],
  ["Create your offer and code", "Choose a discount and how long it runs."],
  ["See who uses it", "We will share how many people redeem your code."],
];

export default async function DealsPage() {
  const deals = await getDeals();
  return (
    <div className="wrap section" style={{ paddingTop: 40 }}>
      <div className="row" style={{ alignItems: "center", gap: 24 }}>
        <div style={{ flex: "1 1 480px", display: "flex", flexDirection: "column", gap: 12 }}>
          <h1 style={{ fontSize: 42, lineHeight: 1.1, letterSpacing: "-0.02em" }}>Local deals, only in SW18</h1>
          <p className="muted" style={{ fontSize: 18 }}>Discount codes from independent pubs, cafés and shops near you.</p>
        </div>
        <div className="panel" style={{ flex: "1 1 360px", gap: 10 }}>
          <div style={{ fontWeight: 600 }}>Get new deals by email</div>
          <LeadForm formName="waitlist" fields={[{ name: "email", label: "Your email", type: "email" }]} button="Notify me" done="Thanks, we will let you know." />
        </div>
      </div>

      {deals.length ? (
        <div className="row">
          {deals.map((d) => (
            <div key={d.id} className="card" style={{ flex: "1 1 300px" }}>
              <div className="card-img" style={{ height: 130, ...(d.image ? { backgroundImage: `url(${d.image}?w=600&fm=webp)` } : {}) }} />
              <div className="card-body" style={{ gap: 8 }}>
                <div className="small muted">{[d.businessName, d.area].filter(Boolean).join(" · ")}</div>
                <div style={{ fontWeight: 700, fontSize: 20 }}>{d.discountText}: {d.headline}</div>
                <div className="small muted">
                  {d.terms ? `${d.terms} ` : ""}
                  {d.validTo ? `Valid until ${dateLong(d.validTo)}.` : ""}
                </div>
                <CopyCode code={d.code} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty">The first deals are coming soon. Join the email list above to hear first.</div>
      )}

      <section id="business" className="panel" style={{ marginTop: 24, padding: 32, gap: 24 }}>
        <div className="between" style={{ alignItems: "center", gap: 16 }}>
          <div style={{ flex: "1 1 360px" }}>
            <h2 className="sub">Run a local business?</h2>
            <p className="muted" style={{ marginTop: 8 }}>Reach people in SW18 who are looking for somewhere to go.</p>
          </div>
          <div style={{ flex: "1 1 360px" }}>
            <LeadForm
              formName="business-interest"
              fields={[
                { name: "business", label: "Business name" },
                { name: "email", label: "Your email", type: "email" },
              ]}
              button="Register interest"
              done="Thanks, we will be in touch."
            />
          </div>
        </div>
        <div className="steps">
          {STEPS.map(([t, d], i) => (
            <div key={t} className="step">
              <b className="n">{i + 1}</b>
              <div style={{ fontWeight: 600, fontSize: 17 }}>{t}</div>
              <div className="small muted">{d}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
