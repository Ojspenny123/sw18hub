import Link from "next/link";
import type { ReactNode } from "react";
import { getEvents, getNews, getPopups, getVenues } from "@/lib/contentful";
import { withRatings } from "@/lib/google";
import { dayKey } from "@/lib/event-types";
import { NEWS_TOPICS, VENUE_TYPES } from "@/lib/types";
import { RUN_CLUBS } from "@/lib/recurring";
import { getSiteSettings, type Block, type PageData } from "@/lib/pages";
import { breadcrumbJsonLd } from "@/lib/seo";
import JsonLd from "./JsonLd";
import AskBox from "./AskBox";
import Chat from "./Chat";
import EventLedger from "./EventLedger";
import EventRow from "./EventRow";
import EventsExplorer from "./EventsExplorer";
import HomePlaces from "./HomePlaces";
import LeadForm from "./LeadForm";
import NewsCard from "./NewsCard";
import NewsRow from "./NewsRow";
import PlacesExplorer from "./PlacesExplorer";
import RunClubs from "./RunClubs";
import Rich from "./Rich";

type Params = { day?: string; topic?: string; area?: string; q?: string };

function Heading({ b, id, className = "sub", style }: { b: Block; id?: string; className?: string; style?: React.CSSProperties }) {
  if (!b.heading) return null;
  const T = b.level === 3 ? "h3" : "h2";
  return (
    <T className={className} id={id} style={style}>
      {b.heading}
    </T>
  );
}
const More = ({ b }: { b: Block }) =>
  b.linkLabel && b.linkUrl ? (
    <Link href={b.linkUrl} className="more-link">
      {b.linkLabel}
    </Link>
  ) : null;

async function loadData(page: PageData) {
  const types = new Set([...page.top, ...page.middle, ...page.bottom].map((x) => x.type));
  const has = (...t: string[]) => t.some((x) => types.has(x as never));
  const [events, news, venues, popups] = await Promise.all([
    has("Coming up", "Events explorer", "Events panel") ? getEvents() : Promise.resolve([]),
    has("News list", "News feed") ? getNews() : Promise.resolve([]),
    has("Places showcase", "Places explorer") || page.intro?.includes("{count}") ? getVenues().then(withRatings) : Promise.resolve([]),
    has("Hero feature", "Featured list") ? getPopups() : Promise.resolve([]),
  ]);
  return { events, news, venues, popups };
}
type Data = Awaited<ReturnType<typeof loadData>>;

function Render({ b, data, params }: { b: Block; data: Data; params: Params }) {
  const todayKey = dayKey(new Date().toISOString());
  const k = b.id;
  switch (b.type) {
    case "Hero feature": {
      // The newest active featured item with a page and a picture; it respects the same dates and days as the pop-up.
      const now = new Date();
      const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/London" }).format(now);
      const dow = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/London", weekday: "long" }).format(now);
      const f = data.popups.find(
        (p) =>
          p.slug &&
          p.imageUrl &&
          !(p.showFrom && today < p.showFrom.slice(0, 10)) &&
          !(p.showUntil && today > p.showUntil.slice(0, 10)) &&
          !(p.showOnDays?.length && !p.showOnDays.includes(dow)),
      );
      if (!f) return null;
      return (
        <Link key={k} href={`/featured/${f.slug}`} className="hero-feature">
          <span className="hero-feature-img">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.imageUrl} alt={f.imageCredit ?? ""} />
          </span>
          <span className="hero-feature-text">
            <span className="hero-feature-k">{b.heading ?? "New in SW18"}</span>
            <span className="hero-feature-h">{f.heading}</span>
            {f.detail ? <span className="hero-feature-d">{f.detail}</span> : null}
            <span className="popup-more">{b.linkLabel ?? "Find out more →"}</span>
          </span>
        </Link>
      );
    }
    case "Coming up": {
      const upcoming = data.events.filter((e) => dayKey(e.endsAt ?? e.startsAt) >= todayKey);
      // Soonest first, each weekly event once, at most three weekly ones so one-off events still show.
      const seen = new Set<string>();
      let weekly = 0;
      const next = upcoming
        .filter((e) => {
          if (!e.series) return true;
          if (seen.has(e.series) || weekly >= 3) return false;
          seen.add(e.series);
          weekly++;
          return true;
        })
        .slice(0, b.count ?? 6);
      return (
        <section key={k} aria-labelledby={`b-${k}`}>
          <div className="between" style={{ marginBottom: 12 }}>
            <Heading b={b} id={`b-${k}`} />
            <More b={b} />
          </div>
          {next.length ? (
            <div className="ledger">
              {next.map((e) => (
                <EventLedger key={e.id} e={e} todayKey={todayKey} />
              ))}
            </div>
          ) : (
            <div className="empty">No upcoming events yet. Check back soon.</div>
          )}
        </section>
      );
    }
    case "Ask panel":
      return (
        <section key={k} className={`askpanel${b.width === "Full" ? " wide" : ""}`} aria-labelledby={`b-${k}`}>
          <Heading b={b} id={`b-${k}`} className="" />
          {b.body ? <p>{b.body}</p> : null}
          <AskBox />
          <p className="ai-note">Answers are written by AI and may be wrong. Check details with the venue.</p>
          {b.links.length ? (
            <div className="chips" style={{ marginTop: 4 }}>
              {b.links.map((l) => (
                <Link key={l.label} href={l.href} className="chip">
                  {l.label}
                </Link>
              ))}
            </div>
          ) : null}
        </section>
      );
    case "Run clubs panel":
      return (
        <section key={k} className="clubpanel" aria-labelledby={`b-${k}`}>
          <Heading b={b} id={`b-${k}`} className="" />
          {RUN_CLUBS.slice(0, b.count ?? 2).map((c) => (
            <p key={c.id}>
              <strong>{c.name}</strong>
              <br />
              <span className="small muted">
                {c.when}, {c.place}
              </span>
            </p>
          ))}
          {b.linkLabel && b.linkUrl ? <Link href={b.linkUrl}>{b.linkLabel}</Link> : null}
        </section>
      );
    case "Places showcase": {
      const per = b.count ?? 4;
      // Featured first then A to Z.
      const pick = (list: typeof data.venues) => [...list].sort((x, y) => Number(y.featured) - Number(x.featured) || x.name.localeCompare(y.name)).slice(0, per);
      const byType = VENUE_TYPES.map((type) => ({ type: type as string, venues: pick(data.venues.filter((v) => v.type === type)) })).filter((g) => g.venues.length);
      // "All" leads with the featured places (any type); only if there are fewer than `per` does it fill with a mix of types.
      const mixed: typeof data.venues = data.venues.filter((v) => v.featured).sort((x, y) => x.name.localeCompare(y.name)).slice(0, per);
      for (let i = 0; i < per; i++) for (const g of byType) if (g.venues[i] && mixed.length < per && !mixed.includes(g.venues[i])) mixed.push(g.venues[i]);
      const groups = [{ type: "All", venues: mixed }, ...byType];
      return (
        <section key={k} className="section" style={{ paddingTop: 0 }}>
          <div className="between">
            <Heading b={b} />
            <More b={b} />
          </div>
          {mixed.length ? <HomePlaces groups={groups} /> : <div className="empty">Places are on their way. Add venues in Contentful and they will show up here.</div>}
        </section>
      );
    }
    case "News list":
      return (
        <section key={k} className="section" style={{ paddingTop: 0 }}>
          <div className="between">
            <Heading b={b} />
            <More b={b} />
          </div>
          {data.news.length ? (
            <div className="nrows">
              {data.news.slice(0, b.count ?? 3).map((n) => (
                <NewsRow key={n.id} n={n} />
              ))}
            </div>
          ) : (
            <div className="empty">No news right now. Check back soon.</div>
          )}
        </section>
      );
    case "Newsletter signup": {
      const form = <LeadForm formName="waitlist" fields={[{ name: "email", label: "Your email", type: "email" }]} button={b.linkLabel ?? "Sign me up"} done="Thanks, you are on the list." />;
      if (b.width === "Half" || b.width === "Side" || b.width === "Main")
        return (
          <div key={k} className="panel">
            <Heading b={b} className="" style={{ fontSize: 20 }} />
            {b.body ? <p className="small muted">{b.body}</p> : null}
            {form}
          </div>
        );
      return (
        <div key={k} className="teaser">
          <div>
            <Heading b={b} />
            {b.body ? <p className="muted">{b.body}</p> : null}
          </div>
          <div>{form}</div>
        </div>
      );
    }
    case "Featured list":
      return (
        <div key={k} style={{ display: "contents" }}>
          {data.popups
            .filter((f) => f.slug)
            .map((f) => (
              <Link key={f.id} href={`/featured/${f.slug}`} className="feat">
                {f.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={f.imageUrl} alt="" />
                ) : null}
                <div>
                  <div className="feat-k">{b.heading ?? "Featured"}</div>
                  <h2>{f.heading}</h2>
                  {f.detail ? <p className="small muted">{f.detail}</p> : null}
                </div>
              </Link>
            ))}
        </div>
      );
    case "Events explorer": {
      const startDay = params.day && /^\d{4}-\d{2}-\d{2}$/.test(params.day) ? params.day : undefined;
      return data.events.length === 0 ? (
        <p key={k} className="muted">No upcoming events listed yet. Check back soon.</p>
      ) : (
        <EventsExplorer key={k} events={data.events} todayKey={todayKey} startDay={startDay} />
      );
    }
    case "Call to action":
      return (
        <div key={k} className="panel" style={{ marginTop: 32 }}>
          <Heading b={b} className="" style={{ fontSize: 20 }} />
          {b.body ? <p className="small muted">{b.body}</p> : null}
          {b.linkLabel && b.linkUrl ? (
            <Link href={b.linkUrl} className="btn">
              {b.linkLabel}
            </Link>
          ) : null}
        </div>
      );
    case "Run clubs list":
      return <RunClubs key={k} intro={b.body} />;
    case "Places explorer":
      return (
        <div key={k} style={{ display: "contents" }}>
          {data.venues.length === 0 ? <div className="empty">No venues yet. Add venues in Contentful and they will appear here.</div> : null}
          <PlacesExplorer venues={data.venues} />
        </div>
      );
    case "News feed": {
      const sw18Only = params.area === "sw18";
      const topic = params.topic;
      const href = (t?: string, a?: string) => {
        const q = new URLSearchParams();
        if (t) q.set("topic", t);
        if (a) q.set("area", a);
        return q.size ? `/news?${q}` : "/news";
      };
      const items = data.news.filter((n) => (!topic || n.topic === topic) && (!sw18Only || n.sw18));
      return (
        <div key={k} style={{ display: "contents" }}>
          <div className="chips" role="group" aria-label="Area">
            <Link href={href(topic)} className={`chip${!sw18Only ? " on" : ""}`}>
              All of Wandsworth
            </Link>
            <Link href={href(topic, "sw18")} className={`chip${sw18Only ? " on" : ""}`}>
              SW18 only
            </Link>
          </div>
          <div className="chips">
            {[undefined, ...NEWS_TOPICS].map((t) => (
              <Link key={t ?? "all"} href={href(t, sw18Only ? "sw18" : undefined)} className={`chip${topic === t || (!topic && !t) ? " on" : ""}`}>
                {t ?? "All topics"}
              </Link>
            ))}
          </div>
          {items.length ? (
            <div className="news-grid">
              {items.slice(0, 24).map((n) => (
                <NewsCard key={n.id} n={n} />
              ))}
            </div>
          ) : (
            <div className="empty">{sw18Only ? "No SW18 stories right now. Try All of Wandsworth." : "No news right now. Check back soon."}</div>
          )}
        </div>
      );
    }
    case "Events panel":
      return (
        <div key={k} className="panel" id="whats-on">
          <Heading b={b} className="" style={{ fontSize: 20 }} />
          {data.events.length ? data.events.slice(0, b.count ?? 5).map((e) => <EventRow key={e.id} e={e} showType={false} />) : <p className="small muted">No upcoming events yet.</p>}
          <More b={b} />
        </div>
      );
    case "Ask chat":
      return <Chat key={k} initialQuestion={params.q?.slice(0, 400)} />;
    case "Text section":
      return (
        <div key={k} className="prose">
          <Heading b={b} className="" />
          {b.body ? <Rich text={b.body} /> : null}
        </div>
      );
    default:
      return null;
  }
}

function Block1({ x, data, params, zone }: { x: Block; data: Data; params: Params; zone: string }) {
  return (
    <>
      <Marker b={x} zone={zone} />
      <Render b={x} data={data} params={params} />
    </>
  );
}

/** Groups side-by-side blocks (Main + Side, or Half + Half) into their own row; everything else stacks. */
/** Invisible label read by the sw18Blocks() console helper; it names the block that follows it. */
function Marker({ b, zone }: { b: Block; zone: string }) {
  return <span hidden data-sw18-marker={`${zone} › ${b.type} · ${b.name}${/^d\d+$/.test(b.id) ? " (built-in default)" : ""}`} />;
}

function Zone({ blocks, data, params, home, zone }: { blocks: Block[]; data: Data; params: Params; home: boolean; zone: string }) {
  const out: ReactNode[] = [];
  for (let i = 0; i < blocks.length; ) {
    const w = blocks[i].width;
    if (w === "Main" || w === "Side") {
      const run: Block[] = [];
      while (i < blocks.length && (blocks[i].width === "Main" || blocks[i].width === "Side")) run.push(blocks[i++]);
      const main = run.filter((x) => x.width === "Main");
      const side = run.filter((x) => x.width === "Side");
      out.push(
        <div key={run[0].id} className={`${home ? "wrap section " : ""}home-main`}>
          {main.map((x) => (
            <Block1 key={x.id} x={x} data={data} params={params} zone={zone} />
          ))}
          {side.length ? (
            <div className="home-side">
              {side.map((x) => (
                <Block1 key={x.id} x={x} data={data} params={params} zone={zone} />
              ))}
            </div>
          ) : null}
        </div>,
      );
    } else if (w === "Half") {
      const run: Block[] = [];
      while (i < blocks.length && blocks[i].width === "Half") run.push(blocks[i++]);
      out.push(
        <div key={run[0].id} className={home ? "wrap section" : undefined}>
          <div className="extras">
            {run.map((x) => (
              <Block1 key={x.id} x={x} data={data} params={params} zone={zone} />
            ))}
          </div>
        </div>,
      );
    } else {
      const x = blocks[i++];
      const el = <Block1 key={x.id} x={x} data={data} params={params} zone={zone} />;
      out.push(home ? <div key={x.id} className="wrap section">{el}</div> : el);
    }
  }
  return <>{out}</>;
}

/**
 * Renders a page: heading, intro, then the top, middle and bottom zones in order.
 * `home` pages stack each block in its own full-width band; other pages put everything in one column.
 */
export default async function PageView({ page, params = {}, home = false, children }: { page: PageData; params?: Params; home?: boolean; children?: ReactNode }) {
  const [data, settings] = await Promise.all([loadData(page), home ? Promise.resolve(null) : getSiteSettings()]);
  const crumb = settings?.navLinks.find((l) => l.href === `/${page.slug}`)?.label ?? page.h1;
  const intro = page.intro?.replace("{count}", String(data.venues.length));
  const zones = (
    <>
      <Zone zone="Top" blocks={page.top} data={data} params={params} home={home} />
      <Zone zone="Middle" blocks={page.middle} data={data} params={params} home={home} />
      <Zone zone="Bottom" blocks={page.bottom} data={data} params={params} home={home} />
    </>
  );
  // On the home page the H1 is the line under the site name in the header (set in Site settings), so it is not repeated here.
  const head = home ? null : (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: crumb, path: `/${page.slug}` }])} />
      <nav className="crumbs" aria-label="Breadcrumb" style={{ marginBottom: 12 }}>
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{crumb}</span>
      </nav>
      <h1 className={page.hideH1 ? "sr" : "title"} data-sw18-block={`Page heading (H1) · ${page.slug}`}>{page.h1}</h1>
      {intro && !page.hideH1 ? (
        <div style={{ margin: "8px 0 20px" }}>
          <Rich text={intro} className="muted" />
        </div>
      ) : null}
    </>
  );
  if (home)
    return (
      <>
        {children}
        {head}
        {zones}
      </>
    );
  return (
    <div className="wrap section" style={{ paddingTop: 24 }}>
      {children}
      {head}
      {zones}
    </div>
  );
}
