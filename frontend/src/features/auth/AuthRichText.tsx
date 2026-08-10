import type { ReactNode } from "react";
import { useLanguage } from "./LanguageProvider";
import type { AuthMessageKey } from "./authCatalog";

export function AuthRichText({
  id,
  values,
}: {
  id: AuthMessageKey;
  values: Record<string, ReactNode>;
}) {
  const { t } = useLanguage();
  const template = t(id);
  const parts = template.split(/\{(\w+)\}/);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? <span key={`${part}-${i}`}>{values[part]}</span> : part,
      )}
    </>
  );
}
