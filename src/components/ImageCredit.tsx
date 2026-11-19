import type { EventItem } from "@/lib/types";

/** "Photo: Author / Wikimedia Commons, CC BY-SA 2.0". Links sit above any card-wide link. */
export default function ImageCredit({ e }: { e: Pick<EventItem, "imageCredit" | "imageCreditUrl" | "imageLicence" | "imageLicenceUrl"> }) {
  if (!e.imageCredit) return null;
  return (
    <span className="credit">
      Photo:{" "}
      {e.imageCreditUrl ? (
        <a href={e.imageCreditUrl} target="_blank" rel="noopener noreferrer">
          {e.imageCredit}
        </a>
      ) : (
        e.imageCredit
      )}
      {e.imageLicence ? (
        <>
          {", "}
          {e.imageLicenceUrl ? (
            <a href={e.imageLicenceUrl} target="_blank" rel="noopener noreferrer">
              {e.imageLicence}
            </a>
          ) : (
            e.imageLicence
          )}
        </>
      ) : null}
    </span>
  );
}
