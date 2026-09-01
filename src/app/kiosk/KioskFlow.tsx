"use client";

import { useEffect, useState } from "react";
import { customerFullName } from "@/lib/customerName";
import { DEPARTMENTS, DEPARTMENT_LABELS, type Department } from "@/lib/departments";

type Step = "contact" | "identify-confirm" | "department" | "items" | "add-more" | "review" | "done";

interface ArticleResult {
  id: string;
  articleNumber: string;
  name: string;
  price: number;
  ean: string | null;
}

interface CartItem {
  articleId?: string;
  freeTextWish?: string;
  name: string;
  quantity: number;
}

const INPUT_CLASS =
  "w-full rounded-xl border-2 border-border px-4 py-3 text-lg focus:border-brand focus:outline-none";
const BUTTON_PRIMARY =
  "w-full rounded-xl bg-brand px-6 py-4 text-lg font-semibold text-white transition hover:bg-brand-dark disabled:opacity-50";
const BUTTON_SECONDARY =
  "w-full rounded-xl border-2 border-border px-6 py-4 text-lg font-semibold text-foreground/70 transition hover:border-brand hover:text-brand";

export function KioskFlow({ filialeId, filialeName }: { filialeId: string; filialeName: string }) {
  const [step, setStep] = useState<Step>("contact");
  // Stack of previously visited steps, so a single "Zurück" button can undo
  // whatever forward navigation (goToStep) happened, including the
  // identify-confirm branch and the items<->add-more loop, without hardcoding
  // a fixed step order.
  const [history, setHistory] = useState<Step[]>([]);
  const [contact, setContact] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [identifiedCustomer, setIdentifiedCustomer] = useState<{
    id: string;
    firstName: string | null;
    lastName: string;
  } | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [department, setDepartment] = useState<Department | null>(null);

  const [articleQuery, setArticleQuery] = useState("");
  const [articleResultsRaw, setArticleResults] = useState<ArticleResult[]>([]);
  const articleResults = articleQuery.trim().length >= 2 ? articleResultsRaw : [];
  const [freeTextWish, setFreeTextWish] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);

  const [note, setNote] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [doneOrderNumber, setDoneOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    if (articleQuery.trim().length < 2) return;
    const timeout = setTimeout(async () => {
      const res = await fetch(`/api/kiosk/articles?q=${encodeURIComponent(articleQuery)}`);
      const data = await res.json();
      setArticleResults(data.articles ?? []);
    }, 250);
    return () => clearTimeout(timeout);
  }, [articleQuery]);

  useEffect(() => {
    if (step !== "done") return;
    const timeout = setTimeout(() => resetAll(), 15000);
    return () => clearTimeout(timeout);
  }, [step]);

  function goToStep(next: Step) {
    setHistory((h) => [...h, step]);
    setStep(next);
  }

  function goBack() {
    setHistory((h) => {
      if (h.length === 0) return h;
      setStep(h[h.length - 1]);
      return h.slice(0, -1);
    });
  }

  function resetAll() {
    setStep("contact");
    setHistory([]);
    setContact({ firstName: "", lastName: "", email: "", phone: "" });
    setIdentifiedCustomer(null);
    setContactError(null);
    setDepartment(null);
    setCart([]);
    setNote("");
    setMarketingConsent(false);
    setSubmitError(null);
    setDoneOrderNumber(null);
  }

  async function submitContact() {
    setContactError(null);
    if (!contact.lastName.trim()) {
      setContactError("Bitte Nachname eingeben.");
      return;
    }
    if (!contact.email.trim() && !contact.phone.trim()) {
      setContactError("Bitte E-Mail oder Telefonnummer angeben, damit wir Sie benachrichtigen können.");
      return;
    }

    setChecking(true);
    const res = await fetch("/api/kiosk/customer-identify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: contact.email || undefined, phone: contact.phone || undefined }),
    });
    const data = await res.json();
    setChecking(false);

    if (data.found) {
      setIdentifiedCustomer(data.customer);
      goToStep("identify-confirm");
    } else {
      goToStep("department");
    }
  }

  function addArticle(article: ArticleResult) {
    setCart((prev) => {
      const existing = prev.find((i) => i.articleId === article.id);
      if (existing) {
        return prev.map((i) => (i.articleId === article.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { articleId: article.id, name: article.name, quantity: 1 }];
    });
    setArticleQuery("");
    setArticleResults([]);
    goToStep("add-more");
  }

  function addFreeTextWish() {
    if (!freeTextWish.trim()) return;
    setCart((prev) => [...prev, { freeTextWish: freeTextWish.trim(), name: freeTextWish.trim(), quantity: 1 }]);
    setFreeTextWish("");
    goToStep("add-more");
  }

  function updateQuantity(index: number, quantity: number) {
    setCart((prev) => prev.map((item, i) => (i === index ? { ...item, quantity } : item)));
  }

  function removeItem(index: number) {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }

  async function submitOrder() {
    setSubmitting(true);
    setSubmitError(null);
    const res = await fetch("/api/kiosk/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filialeId,
        identifiedCustomerId: identifiedCustomer?.id,
        customer: identifiedCustomer
          ? undefined
          : {
              firstName: contact.firstName,
              lastName: contact.lastName,
              email: contact.email || undefined,
              phone: contact.phone || undefined,
            },
        department: department ?? undefined,
        gdprMarketingConsent: marketingConsent,
        note: note || undefined,
        items: cart.map((item) => ({
          articleId: item.articleId,
          freeTextWish: item.freeTextWish,
          quantity: item.quantity,
        })),
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setSubmitError(data.error ?? "Bestellung konnte nicht übermittelt werden.");
      return;
    }
    const data = await res.json().catch(() => ({}));
    setDoneOrderNumber(data.orderNumber ?? null);
    setStep("done");
    setHistory([]);
  }

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-surface px-6 py-4 text-center">
        <h1 className="text-lg font-semibold text-foreground">City Kauf – {filialeName}</h1>
      </header>

      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-8">
        {history.length > 0 && step !== "done" && (
          <button
            onClick={goBack}
            aria-label="Zurück"
            className="mb-4 flex items-center gap-1 self-start text-foreground/60 transition hover:text-brand"
          >
            <span aria-hidden="true" className="text-2xl leading-none">
              ←
            </span>
            <span className="text-sm font-medium">Zurück</span>
          </button>
        )}

        {step === "contact" && (
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-foreground">Willkommen! Wer sind Sie?</h2>
            <input
              placeholder="Vorname (optional)"
              value={contact.firstName}
              onChange={(e) => setContact((c) => ({ ...c, firstName: e.target.value }))}
              className={INPUT_CLASS}
            />
            <input
              placeholder="Nachname"
              value={contact.lastName}
              onChange={(e) => setContact((c) => ({ ...c, lastName: e.target.value }))}
              className={INPUT_CLASS}
            />
            <input
              placeholder="E-Mail"
              value={contact.email}
              onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
              className={INPUT_CLASS}
            />
            <input
              placeholder="Telefonnummer"
              value={contact.phone}
              onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
              className={INPUT_CLASS}
            />
            {contactError && <p className="text-center text-red-600">{contactError}</p>}
            <button onClick={submitContact} disabled={checking} className={BUTTON_PRIMARY}>
              {checking ? "Prüfe…" : "Weiter"}
            </button>
          </div>
        )}

        {step === "identify-confirm" && identifiedCustomer && (
          <div className="flex flex-col gap-4 text-center">
            <h2 className="text-2xl font-bold text-foreground">
              Sind Sie {customerFullName(identifiedCustomer)}?
            </h2>
            <p className="text-foreground/60">Wir haben Sie bereits in unserem System gefunden.</p>
            <button onClick={() => goToStep("department")} className={BUTTON_PRIMARY}>
              Ja, das bin ich
            </button>
            <button
              onClick={() => {
                setIdentifiedCustomer(null);
                goToStep("department");
              }}
              className={BUTTON_SECONDARY}
            >
              Nein, ich bin jemand anderes
            </button>
          </div>
        )}

        {step === "department" && (
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-foreground">In welcher Abteilung möchten Sie bestellen?</h2>
            <div className="flex flex-col gap-3">
              {DEPARTMENTS.map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setDepartment(d);
                    goToStep("items");
                  }}
                  className={BUTTON_SECONDARY}
                >
                  {DEPARTMENT_LABELS[d]}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "items" && (
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-foreground">Was möchten Sie bestellen?</h2>
            <p className="text-foreground/60">
              Sie können beliebig viele Artikel zu Ihrer Bestellung hinzufügen.
            </p>
            <input
              value={articleQuery}
              onChange={(e) => setArticleQuery(e.target.value)}
              placeholder="Artikel, Artikelnummer oder EAN suchen…"
              className={INPUT_CLASS}
            />
            {articleResults.length > 0 && (
              <ul className="divide-y divide-border rounded-xl border-2 border-border">
                {articleResults.map((a) => (
                  <li key={a.id}>
                    <button
                      onClick={() => addArticle(a)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-lg hover:bg-brand/5"
                    >
                      <span>{a.name}</span>
                      <span className="text-sm text-foreground/50">{a.price.toFixed(2)} €</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex gap-2">
              <input
                value={freeTextWish}
                onChange={(e) => setFreeTextWish(e.target.value)}
                placeholder="…oder Wunsch als Text eingeben"
                className={INPUT_CLASS}
              />
              <button
                onClick={addFreeTextWish}
                className="rounded-xl border-2 border-border px-4 font-semibold text-foreground/70 hover:border-brand"
              >
                +
              </button>
            </div>

            {cart.length > 0 && (
              <ul className="flex flex-col gap-2">
                {cart.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-xl border-2 border-border px-4 py-2"
                  >
                    <span>{item.name}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateQuantity(i, Math.max(1, Number(e.target.value)))}
                        className="w-16 rounded-lg border border-border px-2 py-1 text-center"
                      />
                      <button onClick={() => removeItem(i)} className="text-red-600">
                        ✕
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <button
              onClick={() => goToStep("review")}
              disabled={cart.length === 0}
              className={BUTTON_PRIMARY}
            >
              Weiter ({cart.length} Artikel)
            </button>
          </div>
        )}

        {step === "add-more" && (
          <div className="flex flex-col gap-4 text-center">
            <h2 className="text-2xl font-bold text-foreground">Möchten Sie weitere Artikel hinzufügen?</h2>
            {cart.length > 0 && (
              <ul className="flex flex-col gap-2 text-left">
                {cart.map((item, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-2 rounded-xl border-2 border-border px-4 py-2"
                  >
                    <span>{item.name}</span>
                    <span className="text-foreground/50">×{item.quantity}</span>
                  </li>
                ))}
              </ul>
            )}
            <button onClick={() => goToStep("items")} className={BUTTON_PRIMARY}>
              Ja, weiteren Artikel hinzufügen
            </button>
            <button onClick={() => goToStep("review")} className={BUTTON_SECONDARY}>
              Nein, weiter zur Bestellung
            </button>
          </div>
        )}

        {step === "review" && (
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-foreground">Fast fertig</h2>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Sonderwunsch / Notiz (optional)"
              rows={3}
              className={INPUT_CLASS}
            />
            <label className="flex items-start gap-3 rounded-xl border-2 border-border p-4 text-sm">
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className="mt-1 h-5 w-5"
              />
              <span>
                Ich möchte per E-Mail/WhatsApp über Neuheiten und Angebote informiert werden. (Optional –
                die Benachrichtigung, dass Ihre Bestellung abholbereit ist, erhalten Sie in jedem Fall.)
              </span>
            </label>
            {submitError && <p className="text-center text-red-600">{submitError}</p>}
            <button onClick={submitOrder} disabled={submitting} className={BUTTON_PRIMARY}>
              {submitting ? "Wird gesendet…" : "Bestellung abschicken"}
            </button>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="text-5xl">✓</div>
            <h2 className="text-2xl font-bold text-foreground">Danke! Ihre Bestellung wurde aufgenommen.</h2>
            {doneOrderNumber && (
              <p className="text-foreground/70">
                Ihre Vorgangsnummer: <span className="font-mono text-xl font-semibold">{doneOrderNumber}</span>
              </p>
            )}
            <p className="text-foreground/60">
              Wir benachrichtigen Sie, sobald Ihre Bestellung abholbereit ist.
            </p>
            <button onClick={resetAll} className={BUTTON_SECONDARY}>
              Neue Bestellung
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
