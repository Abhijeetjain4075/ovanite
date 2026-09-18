import { r as reactExports, j as jsxRuntimeExports, l as Label, I as Input, P as PrimaryButton, S as SecondaryButton, M as MicroBadge, p as PublishState } from "./index-nAhl1N96.js";
import { A as AdminLayout } from "./AdminLayout-CNQakB_G.js";
import { T as Textarea } from "./textarea-TnSsLILx.js";
import { P as PageMeta } from "./PageMeta-BLn8XJz2.js";
import { S as Skeleton } from "./skeleton-BTXYXnLQ.js";
import { u as useAdminFaqs, a as useCreateFaq, b as useUpdateFaq, c as useSetFaqState, d as useDeleteFaq } from "./useAdminFaqs-DvZVyMrv.js";
import { a as formatDate } from "./format-CdAHKqJe.js";
import { P as Plus, a as Pencil } from "./plus-BPvc-N_4.js";
import { T as Trash2 } from "./trash-2-7l5MbcQX.js";
function parseSortOrder(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) return 0n;
  return BigInt(parsed);
}
function FaqForm({
  faq,
  onSubmit,
  onCancel,
  isPending,
  errorMessage
}) {
  const [question, setQuestion] = reactExports.useState((faq == null ? void 0 : faq.question) ?? "");
  const [answer, setAnswer] = reactExports.useState((faq == null ? void 0 : faq.answer) ?? "");
  const [sortOrder, setSortOrder] = reactExports.useState(faq ? String(faq.sortOrder) : "0");
  const questionError = question.trim() === "" ? "A question is required." : null;
  const answerError = answer.trim() === "" ? "An answer is required." : null;
  function handleSubmit(event) {
    event.preventDefault();
    if (questionError || answerError) return;
    onSubmit({
      question: question.trim(),
      answer: answer.trim(),
      sortOrder: parseSortOrder(sortOrder)
    });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "form",
    {
      noValidate: true,
      onSubmit: handleSubmit,
      "data-ocid": "admin.faq_form",
      className: "space-y-6 border border-border bg-card p-6 md:p-8",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "faq-question", className: "mb-2", children: "Question" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "faq-question",
              value: question,
              onChange: (event) => setQuestion(event.target.value),
              "aria-invalid": questionError ? true : void 0,
              "aria-describedby": questionError ? "faq-question-error" : void 0,
              "data-ocid": "admin.faq.question_input",
              className: "h-11 rounded-sm"
            }
          ),
          questionError ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              id: "faq-question-error",
              role: "alert",
              "data-ocid": "admin.faq.question_error",
              className: "mt-2 text-sm text-destructive",
              children: questionError
            }
          ) : null
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "faq-answer", className: "mb-2", children: "Answer" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              id: "faq-answer",
              rows: 5,
              value: answer,
              onChange: (event) => setAnswer(event.target.value),
              "aria-invalid": answerError ? true : void 0,
              "aria-describedby": answerError ? "faq-answer-error" : void 0,
              "data-ocid": "admin.faq.answer_textarea",
              className: "min-h-32 rounded-sm"
            }
          ),
          answerError ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              id: "faq-answer-error",
              role: "alert",
              "data-ocid": "admin.faq.answer_error",
              className: "mt-2 text-sm text-destructive",
              children: answerError
            }
          ) : null
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "faq-sort-order", className: "mb-2", children: "Order" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: "faq-sort-order",
              type: "number",
              min: 0,
              inputMode: "numeric",
              value: sortOrder,
              onChange: (event) => setSortOrder(event.target.value),
              "data-ocid": "admin.faq.sort_order_input",
              className: "h-11 rounded-sm"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-muted-foreground", children: "Lower numbers appear first." })
        ] }),
        errorMessage ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "p",
          {
            role: "alert",
            "data-ocid": "admin.faq.form_error",
            className: "border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive",
            children: errorMessage
          }
        ) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-3 border-t border-border pt-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            PrimaryButton,
            {
              type: "submit",
              disabled: isPending,
              "data-ocid": "admin.faq.submit_button",
              children: isPending ? "Saving…" : faq ? "Save changes" : "Create FAQ"
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            SecondaryButton,
            {
              type: "button",
              onClick: onCancel,
              disabled: isPending,
              "data-ocid": "admin.faq.cancel_button",
              children: "Cancel"
            }
          )
        ] })
      ]
    }
  );
}
const SKELETON_IDS = Array.from(
  { length: 4 },
  (_, i) => `admin-faqs-skeleton-${i}`
);
function errorText(error) {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes("Unauthorized")) {
    return "You do not have permission to perform this action.";
  }
  return "Something went wrong. Please try again.";
}
function AdminFaqs() {
  const { data, isLoading, isError, refetch } = useAdminFaqs();
  const createFaq = useCreateFaq();
  const updateFaq = useUpdateFaq();
  const setFaqState = useSetFaqState();
  const deleteFaq = useDeleteFaq();
  const [editing, setEditing] = reactExports.useState(null);
  const [creating, setCreating] = reactExports.useState(false);
  const [confirmingId, setConfirmingId] = reactExports.useState(null);
  const faqs = data ?? [];
  const sorted = [...faqs].sort((a, b) => {
    if (a.sortOrder === b.sortOrder) return Number(a.id - b.id);
    return a.sortOrder < b.sortOrder ? -1 : 1;
  });
  const formOpen = creating || editing !== null;
  const activeMutation = editing ? updateFaq : createFaq;
  function closeForm() {
    setCreating(false);
    setEditing(null);
    createFaq.reset();
    updateFaq.reset();
  }
  function handleSubmit(input) {
    if (editing) {
      updateFaq.mutate(
        { id: editing.id, patch: input },
        { onSuccess: () => closeForm() }
      );
      return;
    }
    createFaq.mutate(input, { onSuccess: () => closeForm() });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageMeta,
      {
        title: "FAQs",
        description: "Create, edit, order, and publish the frequently asked questions shown on the Ovanite site."
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      AdminLayout,
      {
        title: "FAQs",
        description: "Create, edit, order, and publish the questions shown on the public site.",
        action: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          PrimaryButton,
          {
            type: "button",
            onClick: () => {
              setEditing(null);
              setCreating(true);
            },
            "data-ocid": "admin.faqs.create_button",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { "aria-hidden": "true", className: "h-4 w-4" }),
              "New FAQ"
            ]
          }
        ),
        children: [
          formOpen ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mb-4 font-display text-lg font-bold tracking-tight", children: editing ? "Edit FAQ" : "New FAQ" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              FaqForm,
              {
                faq: editing ?? void 0,
                onSubmit: handleSubmit,
                onCancel: closeForm,
                isPending: activeMutation.isPending,
                errorMessage: activeMutation.isError ? errorText(activeMutation.error) : void 0
              },
              editing ? String(editing.id) : "new"
            )
          ] }) : null,
          isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-ocid": "admin.faqs.loading_state", className: "space-y-3", children: SKELETON_IDS.map((id) => /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-24 rounded-sm" }, id)) }) : isError ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": "admin.faqs.error_state",
              className: "border border-border bg-card p-8",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "We couldn’t load the FAQs." }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(
                  SecondaryButton,
                  {
                    type: "button",
                    className: "mt-4",
                    onClick: () => void refetch(),
                    "data-ocid": "admin.faqs.retry_button",
                    children: "Try again"
                  }
                )
              ]
            }
          ) : sorted.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              "data-ocid": "admin.faqs.empty_state",
              className: "border border-border bg-card p-10 text-center",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "eyebrow", children: "No FAQs" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-4 font-display text-2xl font-bold tracking-tight", children: "Add your first FAQ" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mx-auto mt-3 max-w-md text-sm text-muted-foreground", children: "Published FAQs appear in the questions section of the public site." }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  PrimaryButton,
                  {
                    type: "button",
                    className: "mt-6",
                    onClick: () => setCreating(true),
                    "data-ocid": "admin.faqs.empty_create_button",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { "aria-hidden": "true", className: "h-4 w-4" }),
                      "New FAQ"
                    ]
                  }
                )
              ]
            }
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { "data-ocid": "admin.faqs.list", className: "space-y-3", children: sorted.map((faq, i) => {
            const isPublished = faq.state === "published";
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "li",
              {
                "data-ocid": `admin.faqs.item.${i + 1}`,
                className: "border border-border bg-card p-5",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-lg font-bold tracking-tight", children: faq.question }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(MicroBadge, { children: isPublished ? "Published" : "Draft" })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 line-clamp-3 max-w-2xl text-sm text-muted-foreground", children: faq.answer }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-muted-foreground", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                          "Order ",
                          String(faq.sortOrder)
                        ] }),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
                          "Updated ",
                          formatDate(faq.updatedAt)
                        ] })
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        SecondaryButton,
                        {
                          type: "button",
                          onClick: () => setFaqState.mutate({
                            id: faq.id,
                            state: isPublished ? PublishState.draft : PublishState.published
                          }),
                          disabled: setFaqState.isPending,
                          "data-ocid": `admin.faqs.publish_toggle.${i + 1}`,
                          children: isPublished ? "Unpublish" : "Publish"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        SecondaryButton,
                        {
                          type: "button",
                          onClick: () => {
                            setCreating(false);
                            setEditing(faq);
                          },
                          "data-ocid": `admin.faqs.edit_button.${i + 1}`,
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Pencil, { "aria-hidden": "true", className: "h-4 w-4" }),
                            "Edit"
                          ]
                        }
                      ),
                      confirmingId === faq.id ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          SecondaryButton,
                          {
                            type: "button",
                            onClick: () => {
                              deleteFaq.mutate(faq.id);
                              setConfirmingId(null);
                            },
                            disabled: deleteFaq.isPending,
                            "data-ocid": `admin.faqs.confirm_delete_button.${i + 1}`,
                            className: "border-destructive/50 text-destructive hover:bg-destructive/10",
                            children: "Confirm delete"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          SecondaryButton,
                          {
                            type: "button",
                            onClick: () => setConfirmingId(null),
                            "data-ocid": `admin.faqs.cancel_delete_button.${i + 1}`,
                            children: "Cancel"
                          }
                        )
                      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(
                        SecondaryButton,
                        {
                          type: "button",
                          onClick: () => setConfirmingId(faq.id),
                          "data-ocid": `admin.faqs.delete_button.${i + 1}`,
                          className: "text-destructive hover:bg-destructive/10",
                          children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { "aria-hidden": "true", className: "h-4 w-4" }),
                            "Delete"
                          ]
                        }
                      )
                    ] })
                  ] }),
                  setFaqState.isError ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "p",
                    {
                      role: "alert",
                      "data-ocid": `admin.faqs.state_error.${i + 1}`,
                      className: "mt-3 text-sm text-destructive",
                      children: errorText(setFaqState.error)
                    }
                  ) : null,
                  deleteFaq.isError ? /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "p",
                    {
                      role: "alert",
                      "data-ocid": `admin.faqs.delete_error.${i + 1}`,
                      className: "mt-3 text-sm text-destructive",
                      children: errorText(deleteFaq.error)
                    }
                  ) : null
                ]
              },
              String(faq.id)
            );
          }) })
        ]
      }
    )
  ] });
}
export {
  AdminFaqs as default
};
