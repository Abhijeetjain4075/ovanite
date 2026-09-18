import { i as useNavigate, a as useActor, r as reactExports, k as useMutation, j as jsxRuntimeExports, l as Label, I as Input, P as PrimaryButton, d as createActor, e as useSiteContent, C as Container } from "./index-nAhl1N96.js";
import { T as Textarea } from "./textarea-TnSsLILx.js";
import { i as isDuplicateResult, c as validateNote, a as validateEmail, b as validateName } from "./validation-D1I7ai0A.js";
import { B as Breadcrumbs } from "./Breadcrumbs-C4_qKhBm.js";
import { P as PageMeta } from "./PageMeta-BLn8XJz2.js";
import { r as resolveSiteCopy } from "./siteCopy-yL4ekaS-.js";
const FIELD_IDS = {
  name: "waitlist-name",
  email: "waitlist-email",
  note: "waitlist-note"
};
function WaitlistForm() {
  const navigate = useNavigate();
  const { actor } = useActor(createActor);
  const [name, setName] = reactExports.useState("");
  const [email, setEmail] = reactExports.useState("");
  const [note, setNote] = reactExports.useState("");
  const [errors, setErrors] = reactExports.useState({});
  const [alreadyReceived, setAlreadyReceived] = reactExports.useState(false);
  const mutation = useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.submitWaitlist(input);
    },
    onSuccess: (result) => {
      if (isDuplicateResult(result)) {
        setAlreadyReceived(true);
        return;
      }
      navigate("/thank-you", { state: { kind: "waitlist" } });
    }
  });
  function validate() {
    const next = {
      name: validateName(name),
      email: validateEmail(email),
      note: validateNote(note)
    };
    setErrors(next);
    return !next.name && !next.email && !next.note;
  }
  function handleSubmit(event) {
    event.preventDefault();
    setAlreadyReceived(false);
    if (!validate()) return;
    const trimmedNote = note.trim();
    mutation.mutate({
      name: name.trim(),
      email: email.trim(),
      ...trimmedNote ? { note: trimmedNote } : {}
    });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "form",
    {
      noValidate: true,
      onSubmit: handleSubmit,
      "data-ocid": "waitlist.form",
      className: "space-y-6",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: FIELD_IDS.name, className: "mb-2", children: "Name" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: FIELD_IDS.name,
              name: "name",
              autoComplete: "name",
              value: name,
              onChange: (event) => setName(event.target.value),
              "aria-invalid": errors.name ? true : void 0,
              "aria-describedby": errors.name ? `${FIELD_IDS.name}-error` : void 0,
              "data-ocid": "waitlist.name_input",
              className: "h-11 rounded-sm"
            }
          ),
          errors.name ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              id: `${FIELD_IDS.name}-error`,
              role: "alert",
              "data-ocid": "waitlist.name_error",
              className: "mt-2 text-sm text-destructive",
              children: errors.name
            }
          ) : null
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: FIELD_IDS.email, className: "mb-2", children: "Email" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Input,
            {
              id: FIELD_IDS.email,
              name: "email",
              type: "email",
              autoComplete: "email",
              value: email,
              onChange: (event) => setEmail(event.target.value),
              "aria-invalid": errors.email ? true : void 0,
              "aria-describedby": errors.email ? `${FIELD_IDS.email}-error` : void 0,
              "data-ocid": "waitlist.email_input",
              className: "h-11 rounded-sm"
            }
          ),
          errors.email ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              id: `${FIELD_IDS.email}-error`,
              role: "alert",
              "data-ocid": "waitlist.email_error",
              className: "mt-2 text-sm text-destructive",
              children: errors.email
            }
          ) : null
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { htmlFor: FIELD_IDS.note, className: "mb-2", children: [
            "Note",
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-normal text-muted-foreground", children: "(optional)" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              id: FIELD_IDS.note,
              name: "note",
              rows: 4,
              value: note,
              onChange: (event) => setNote(event.target.value),
              "aria-invalid": errors.note ? true : void 0,
              "aria-describedby": errors.note ? `${FIELD_IDS.note}-error` : void 0,
              "data-ocid": "waitlist.note_textarea",
              className: "min-h-24 rounded-sm"
            }
          ),
          errors.note ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              id: `${FIELD_IDS.note}-error`,
              role: "alert",
              "data-ocid": "waitlist.note_error",
              className: "mt-2 text-sm text-destructive",
              children: errors.note
            }
          ) : null
        ] }),
        alreadyReceived ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "output",
          {
            "aria-live": "polite",
            "data-ocid": "waitlist.already_received_state",
            className: "block border border-accent/40 bg-accent/5 px-4 py-3 text-sm text-foreground",
            children: "Already received — you are on the list with this exact note. We will be in touch when there is something real to share."
          }
        ) : null,
        mutation.isError ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "p",
          {
            role: "alert",
            "data-ocid": "waitlist.error_state",
            className: "border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive",
            children: "Something went wrong joining the waitlist. Please try again."
          }
        ) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          PrimaryButton,
          {
            type: "submit",
            size: "lg",
            disabled: mutation.isPending,
            "data-ocid": "waitlist.submit_button",
            children: mutation.isPending ? "Joining…" : "Join the waitlist"
          }
        )
      ]
    }
  );
}
function Waitlist() {
  const { data } = useSiteContent();
  const copy = resolveSiteCopy(data);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageMeta,
      {
        title: "Waitlist",
        description: "Join the Ovanite waitlist to be the first to know when our software products launch."
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Breadcrumbs,
      {
        items: [{ label: "Home", to: "/" }, { label: "Waitlist" }]
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { className: "py-16 md:py-24", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-3 border-t border-border pt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs font-medium tracking-[0.22em] text-primary", children: "01" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "eyebrow", children: "Waitlist" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-10 grid gap-14 md:grid-cols-12 md:gap-10", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:col-span-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-balance font-display text-4xl font-bold tracking-tight md:text-5xl", children: copy.waitlistTitle }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-6 max-w-md text-pretty text-lg leading-relaxed text-muted-foreground", children: copy.waitlistBody })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "md:col-span-7", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-border bg-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4 border-b border-border px-6 py-4 md:px-10", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "eyebrow", children: "Early access" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted-foreground", children: "No noise, launch updates only" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6 md:p-10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(WaitlistForm, {}) })
        ] }) })
      ] })
    ] })
  ] });
}
export {
  Waitlist as default
};
