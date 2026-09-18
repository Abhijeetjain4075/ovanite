import { r as reactExports, j as jsxRuntimeExports, l as Label, I as Input, P as PrimaryButton, e as useSiteContent, a as useActor, q as useQueryClient, k as useMutation, S as SecondaryButton, t as siteContentQueryKey, d as createActor } from "./index-nAhl1N96.js";
import { A as AdminLayout } from "./AdminLayout-CNQakB_G.js";
import { T as Textarea } from "./textarea-TnSsLILx.js";
import { P as PageMeta } from "./PageMeta-BLn8XJz2.js";
import { S as Skeleton } from "./skeleton-BTXYXnLQ.js";
const GROUPS = [
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
        rows: 3
      },
      { key: "primaryCtaLabel", label: "Primary CTA label" },
      {
        key: "primaryCtaHref",
        label: "Primary CTA link",
        hint: "Internal path such as /waitlist, or a full URL."
      },
      { key: "secondaryCtaLabel", label: "Secondary CTA label" },
      { key: "secondaryCtaHref", label: "Secondary CTA link" }
    ]
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
        rows: 4
      }
    ]
  },
  {
    id: "approach",
    title: "Approach",
    description: "How Ovanite works, shown on the home page.",
    fields: [
      { key: "approachTitle", label: "Title" },
      { key: "approachBody", label: "Body", multiline: true, rows: 4 }
    ]
  },
  {
    id: "about",
    title: "About",
    description: "The about page introduction.",
    fields: [
      { key: "aboutTitle", label: "Title" },
      { key: "aboutBody", label: "Body", multiline: true, rows: 5 }
    ]
  },
  {
    id: "contact",
    title: "Contact",
    description: "Copy shown on the contact page.",
    fields: [
      { key: "contactTitle", label: "Title" },
      { key: "contactBody", label: "Body", multiline: true, rows: 3 }
    ]
  },
  {
    id: "waitlist",
    title: "Waitlist",
    description: "Copy shown on the waitlist page.",
    fields: [
      { key: "waitlistTitle", label: "Title" },
      { key: "waitlistBody", label: "Body", multiline: true, rows: 3 }
    ]
  },
  {
    id: "legal",
    title: "Legal",
    description: "Privacy and terms page bodies.",
    fields: [
      { key: "privacyBody", label: "Privacy body", multiline: true, rows: 6 },
      { key: "termsBody", label: "Terms body", multiline: true, rows: 6 }
    ]
  },
  {
    id: "footer",
    title: "Footer",
    description: "The short line rendered in the site footer.",
    fields: [
      { key: "footerText", label: "Footer text", multiline: true, rows: 2 }
    ]
  }
];
function initialDraft(content) {
  const draft = {};
  for (const group of GROUPS) {
    for (const field of group.fields) {
      draft[field.key] = content[field.key] ?? "";
    }
  }
  return draft;
}
function SiteCopyForm({
  content,
  onSubmit,
  isPending,
  errorMessage
}) {
  const [draft, setDraft] = reactExports.useState(() => initialDraft(content));
  const contentVersion = String(content.updatedAt);
  const syncedVersion = reactExports.useRef(contentVersion);
  reactExports.useEffect(() => {
    if (syncedVersion.current === contentVersion) return;
    syncedVersion.current = contentVersion;
    setDraft(initialDraft(content));
  }, [content, contentVersion]);
  function setField(key, value) {
    setDraft((current) => ({ ...current, [key]: value }));
  }
  function handleSubmit(event) {
    event.preventDefault();
    const patch = {};
    for (const group of GROUPS) {
      for (const field of group.fields) {
        const next = draft[field.key] ?? "";
        const current = content[field.key] ?? "";
        if (next === current) continue;
        patch[field.key] = next;
      }
    }
    onSubmit(patch);
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "form",
    {
      noValidate: true,
      onSubmit: handleSubmit,
      "data-ocid": "admin.site_copy_form",
      className: "space-y-8",
      children: [
        GROUPS.map((group) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "fieldset",
          {
            "data-ocid": `admin.site_copy.${group.id}_section`,
            className: "border border-border bg-card p-6 md:p-8",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("legend", { className: "px-2 font-mono text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground", children: group.title }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: group.description }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6 space-y-5", children: group.fields.map((field) => {
                const inputId = `site-copy-${field.key}`;
                const value = draft[field.key] ?? "";
                return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: inputId, className: "mb-2", children: field.label }),
                  field.multiline ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Textarea,
                    {
                      id: inputId,
                      rows: field.rows ?? 3,
                      value,
                      onChange: (event) => setField(field.key, event.target.value),
                      "data-ocid": `admin.site_copy.${field.key}_textarea`,
                      className: "rounded-sm"
                    }
                  ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Input,
                    {
                      id: inputId,
                      value,
                      onChange: (event) => setField(field.key, event.target.value),
                      "data-ocid": `admin.site_copy.${field.key}_input`,
                      className: "h-11 rounded-sm"
                    }
                  ),
                  field.hint ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-muted-foreground", children: field.hint }) : null
                ] }, field.key);
              }) })
            ]
          },
          group.id
        )),
        errorMessage ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "p",
          {
            role: "alert",
            "data-ocid": "admin.site_copy.form_error",
            className: "border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive",
            children: errorMessage
          }
        ) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "sticky bottom-0 flex flex-wrap items-center gap-3 border-t border-border bg-background/95 py-4 backdrop-blur", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            PrimaryButton,
            {
              type: "submit",
              disabled: isPending,
              "data-ocid": "admin.site_copy.submit_button",
              children: isPending ? "Saving…" : "Save site copy"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "Only changed fields are saved. Clearing a field resets it to the site default. Published changes appear on the public site immediately." })
        ] })
      ]
    }
  );
}
function errorText(error) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("Unauthorized")) {
    return "You do not have permission to edit site copy.";
  }
  return "Something went wrong saving the site copy. Please try again.";
}
function AdminSiteCopy() {
  const { data, isLoading, isError, refetch } = useSiteContent();
  const { actor } = useActor(createActor);
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (patch) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.updateSiteContent(patch);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: siteContentQueryKey });
    }
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageMeta,
      {
        title: "Site Copy",
        description: "Edit the headlines, descriptions, and body copy shown across the Ovanite site."
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      AdminLayout,
      {
        title: "Site Copy",
        description: "Edit the headlines, descriptions, and body copy shown across the public site. Clearing a field resets it to the site default.",
        children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-ocid": "admin.site_copy.loading_state", className: "space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-64 rounded-sm" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-64 rounded-sm" })
        ] }) : isError || !data ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            "data-ocid": "admin.site_copy.error_state",
            className: "border border-border bg-card p-8",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "We couldn’t load the site copy." }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                SecondaryButton,
                {
                  type: "button",
                  className: "mt-4",
                  onClick: () => void refetch(),
                  "data-ocid": "admin.site_copy.retry_button",
                  children: "Try again"
                }
              )
            ]
          }
        ) : /* @__PURE__ */ jsxRuntimeExports.jsx(
          SiteCopyForm,
          {
            content: data,
            onSubmit: (patch) => mutation.mutate(patch),
            isPending: mutation.isPending,
            errorMessage: mutation.isError ? errorText(mutation.error) : void 0
          }
        )
      }
    )
  ] });
}
export {
  AdminSiteCopy as default
};
