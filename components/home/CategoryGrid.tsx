import {
  Atom,
  Briefcase,
  Gavel,
  Languages,
  Leaf,
  Cog,
  Landmark,
  Users,
  Stethoscope,
  BookOpen,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import type { Category } from "@/lib/queries/home";

// Association mot-clé → icône, évaluée dans l'ordre.
const ICON_RULES: Array<[RegExp, LucideIcon]> = [
  [/économiq|gestion|commerce|comptab/i, Briefcase],
  [/juridiq|droit/i, Gavel],
  [/lettres|langage|langue/i, Languages],
  [/agronom|vétérinaire|agricole|environnement/i, Leaf],
  [/polytechn|technolog|mines|génie|industri/i, Cog],
  [/médecine|santé|pharmac/i, Stethoscope],
  [/éducation|pédagog/i, BookOpen],
  [/social/i, Users],
  [/science/i, Atom],
];

function iconFor(name: string): LucideIcon {
  return ICON_RULES.find(([re]) => re.test(name))?.[1] ?? Landmark;
}

export function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => {
        const Icon = iconFor(category.name);
        return (
          <GlassCard key={category.name} variant="2" className="p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-button border border-glass-border bg-glass-2">
              <Icon className="h-5 w-5 text-secondary" aria-hidden />
            </div>
            <h3 className="mt-4 font-semibold leading-snug">{category.name}</h3>
            <p className="mt-1 text-sm text-muted">
              {category.programCount} formation
              {category.programCount > 1 ? "s" : ""}
            </p>
          </GlassCard>
        );
      })}
    </div>
  );
}
