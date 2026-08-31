import Link from "next/link";
import {
  Banknote,
  Building2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  LayoutGrid,
  Library,
  Network,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Item = {
  href: string;
  label: string;
  icon: LucideIcon;
  ready: boolean;
};

// Toutes les sections disposent désormais de leurs routes API et de leur
// écran ; aucune n'est marquée "à venir".
export const ADMIN_NAV: Item[] = [
  { href: "/admin", label: "Vue d'ensemble", icon: LayoutGrid, ready: true },
  { href: "/admin/institutions", label: "Établissements", icon: Building2, ready: true },
  { href: "/admin/unites", label: "Unités académiques", icon: Library, ready: true },
  { href: "/admin/departements", label: "Départements", icon: Network, ready: true },
  { href: "/admin/formations", label: "Formations", icon: GraduationCap, ready: true },
  { href: "/admin/admissions", label: "Conditions d'admission", icon: ClipboardCheck, ready: true },
  { href: "/admin/frais", label: "Frais", icon: Banknote, ready: true },
  { href: "/admin/sources", label: "Sources", icon: FileText, ready: true },
  { href: "/admin/utilisateurs", label: "Utilisateurs & rôles", icon: Users, ready: true },
];

export function AdminSidebar() {
  return (
    <nav aria-label="Navigation du back-office" className="flex flex-col gap-1">
      {ADMIN_NAV.map((item) =>
        item.ready ? (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2.5 rounded-button px-3 py-2 text-sm text-muted outline-none transition-colors duration-150 ease-out hover:bg-glass-2 hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary"
          >
            <item.icon className="h-4 w-4 shrink-0" aria-hidden />
            {item.label}
          </Link>
        ) : (
          <span
            key={item.href}
            aria-disabled="true"
            title="Section à venir — routes API non disponibles"
            className="flex cursor-not-allowed items-center gap-2.5 rounded-button px-3 py-2 text-sm text-muted-dark"
          >
            <item.icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="flex-1">{item.label}</span>
            <span className="rounded-pill border border-glass-border px-1.5 py-0.5 text-[10px] leading-none">
              à venir
            </span>
          </span>
        )
      )}
    </nav>
  );
}
