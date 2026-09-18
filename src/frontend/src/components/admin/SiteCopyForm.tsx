import { useEffect, useRef, useState } from "react";

import type { SiteContent, SiteContentPatch } from "@/backend";

import { PrimaryButton } from "@/components/shared/primitives";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SiteCopyFormProps = {
  content: SiteContent;
  onSubmit: (patch: SiteContentPatch) => void;
  isPending: boolean;
  errorMessage?: string;
};

type FieldDef = {
  key: keyof SiteContentPatch;
  label: string;
  hint?: string;
  multiline?: boolean;
  rows?: number;
};

type GroupDef = {
  id: string;
  title: string;
  description: string;
  fields: FieldDef[];
};

const GROUPS: GroupDef[] = [
  {
    id: "hero",
    title: "Hero",
    description: "The first headline and supporting copy on the home page.",
    fields: [
      { key: "heroHeadline", label: "Headline" },
      {
        key: "heroDescription",
        label: "Description",
        multiline: true,
        rows: 3,
      },
      { key: "primaryCtaLabel", label: "Primary CTA label" },
      {
        key: "primaryCtaHref",
        label: "Primary CTA link",
        hint: "Internal path such as /waitlist, or a full URL.",
      },
      { key: "secondaryCtaLabel", label: "Secondary CTA label" },
      { key: "secondaryCtaHref", label: "Secondary CTA link" },
    ],
  },
  {
    id: "philosophy",
    title: "Philosophy",
    description: "The principles section on the home page.",
    fields: [
      { key: "philosophyTitle", label: "Title" },
      {
        key: "philosophyBody",
        label: "Body",
        multiline: true,
        rows: 4,
      },
    ],
  },
  {
    id: "approach",
    title: "Approach",
    description: "How Ovanite works, shown on the home page.",
    fields: [
      { key: "approachTitle", label: "Title" },
      { key: "approachBody", label: "Body", multiline: true, rows: 4 },
    ],
  },
  {
    id: "about",
    title: "About",
    description: "The about page introduction.",
    fields: [
      { key: "aboutTitle", label: "Title" },
      { key: "aboutBody", label: "Body", multiline: true, rows: 5 },
    ],
  },
  {
    id: "contact",
    title: "Contact",
    description: "Copy shown on the contact page.",
    fields: [
      { key: "contactTitle", label: "Title" },
      { key: "contactBody", label: "Body", multiline: true, rows: 3 },
    ],
  },
  {
    id: "waitlist",
    title: "Waitlist",
    description: "Copy shown on the waitlist page.",
    fields: [
      { key: "waitlistTitle", label: "Title" },
      { key: "waitlistBody", label: "Body", multiline: true, rows: 3 },
    ],
  },
  {
    id: "legal",
    title: "Legal",
    description: "Privacy and terms page bodies.",
    fields: [
      { key: "privacyBody", label: "Privacy body", multiline: true, rows: 6 },
      { key: "termsBody", label: "Terms body", multiline: true, rows: 6 },
    ],
  },
  {
    id: "footer",
    title: "Footer",
    description: "The short line rendered in the site footer.",
    fields: [
      { key: "footerText", label: "Footer text", multiline: true, rows: 2 },
    ],
  },
];

type Draft = Partial<Record<keyof SiteContentPatch, string>>;

function initialDraft(content: SiteContent): Draft {
  const draft: Draft = {};
  for (const group of GROUPS) {
    for (const field of group.fields) {
      draft[field.key] = content[field.key] ?? "";
    }
  }
  return draft;
}

/**
 * Edits every editable site-copy field. Only fields the admin actually changed
 * are sent: the backend's `mergeText` treats an absent field as "leave
 * untouched", so a no-op save never blanks the site. A field the admin
 * deliberately cleared is sent as an explicit empty string, which
 * `resolveSiteCopy` treats as unset and renders as the site default.
 */
export function SiteCopyForm({
  content,
  onSubmit,
  isPending,
  errorMessage,
}: SiteCopyFormProps) {
  const [draft, setDraft] = useState<Draft>(() => initialDraft(content));

  // Resync the draft whenever the backend copy changes (e.g. a refetch after a
  // save or an edit made elsewhere). Keyed on `updatedAt` so ordinary refetches
  // that return identical data never clobber in-progress edits.
  const contentVersion = String(content.updatedAt);
  const syncedVersion = useRef(contentVersion);
  useEffect(() => {
    if (syncedVersion.current === contentVersion) return;
    syncedVersion.current = contentVersion;
    setDraft(initialDraft(content));
  }, [content, contentVersion]);

  function setField(key: keyof SiteContentPatch, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const patch: SiteContentPatch = {};
    for (const group of GROUPS) {
      for (const field of group.fields) {
        const next = draft[field.key] ?? "";
        const current = content[field.key] ?? "";
        // Omit untouched fields entirely: the backend's mergeText treats an
        // absent field as "leave untouched", so a no-op save cannot blank the
        // site. A changed field is sent as-is, including an explicit "" when
        // the admin cleared it, which resolveSiteCopy renders as the default.
        if (next === current) continue;
        patch[field.key] = next;
      }
    }
    onSubmit(patch);
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      data-ocid="admin.site_copy_form"
      className="space-y-8"
    >
      {GROUPS.map((group) => (
        <fieldset
          key={group.id}
          data-ocid={`admin.site_copy.${group.id}_section`}
          className="border border-border bg-card p-6 md:p-8"
        >
          <legend className="px-2 font-mono text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {group.title}
          </legend>
          <p className="mt-1 text-sm text-muted-foreground">
            {group.description}
          </p>

          <div className="mt-6 space-y-5">
            {group.fields.map((field) => {
              const inputId = `site-copy-${field.key}`;
              const value = draft[field.key] ?? "";
              return (
                <div key={field.key}>
                  <Label htmlFor={inputId} className="mb-2">
                    {field.label}
                  </Label>
                  {field.multiline ? (
                    <Textarea
                      id={inputId}
                      rows={field.rows ?? 3}
                      value={value}
                      onChange={(event) =>
                        setField(field.key, event.target.value)
                      }
                      data-ocid={`admin.site_copy.${field.key}_textarea`}
                      className="rounded-sm"
                    />
                  ) : (
                    <Input
                      id={inputId}
                      value={value}
                      onChange={(event) =>
                        setField(field.key, event.target.value)
                      }
                      data-ocid={`admin.site_copy.${field.key}_input`}
                      className="h-11 rounded-sm"
                    />
                  )}
                  {field.hint ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {field.hint}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </fieldset>
      ))}

      {errorMessage ? (
        <p
          role="alert"
          data-ocid="admin.site_copy.form_error"
          className="border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {errorMessage}
        </p>
      ) : null}

      <div className="sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-border bg-background/95 py-4 backdrop-blur">
        <PrimaryButton
          type="submit"
          disabled={isPending}
          data-ocid="admin.site_copy.submit_button"
        >
          {isPending ? "Saving…" : "Save site copy"}
        </PrimaryButton>
        <p className="text-xs text-muted-foreground">
          Only changed fields are saved. Clearing a field resets it to the site
          default. Published changes appear on the public site immediately.
        </p>
      </div>
    </form>
  );
}
