"use client";

import { track } from "@/lib/analytics";
import { useState } from "react";

interface Field {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}

/** Posts to Netlify Forms (see public/__forms.html). */
export default function LeadForm({
  formName,
  fields,
  button,
  done,
}: {
  formName: string;
  fields: Field[];
  button: string;
  done: string;
}) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    const data = new FormData(e.currentTarget);
    const body = new URLSearchParams({ "form-name": formName });
    data.forEach((v, k) => body.append(k, String(v)));
    try {
      const res = await fetch("/__forms.html", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      if (res.ok) track("form_submit", { form_name: formName });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") return <p role="status" style={{ fontWeight: 600 }}>{done}</p>;

  return (
    <form onSubmit={onSubmit} className="form-row" aria-label={button}>
      {fields.map((f) => (
        <span key={f.name} className="field">
          <label htmlFor={`${formName}-${f.name}`} className="sr">
            {f.label}
          </label>
          <input
            id={`${formName}-${f.name}`}
            name={f.name}
            type={f.type ?? "text"}
            placeholder={f.label}
            required={f.required ?? true}
            style={{ width: "100%" }}
          />
        </span>
      ))}
      <button type="submit" className="btn" disabled={state === "sending"}>
        {state === "sending" ? "Sending..." : button}
      </button>
      {state === "error" ? <span role="alert" className="small">Something went wrong. Please try again.</span> : null}
    </form>
  );
}
