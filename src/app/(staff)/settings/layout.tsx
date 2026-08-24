import Link from "next/link";

const TABS = [
  { href: "/settings/templates", label: "Nachrichtenvorlagen" },
  { href: "/settings/users", label: "Benutzer" },
  { href: "/settings/filialen", label: "Filialen" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <h1 className="text-xl font-semibold text-foreground">Einstellungen</h1>
      <div className="mt-4 flex gap-1 border-b border-border">
        {TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className="rounded-t-lg px-4 py-2 text-sm font-medium text-foreground/60 hover:bg-brand/5 hover:text-brand"
          >
            {tab.label}
          </Link>
        ))}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}
