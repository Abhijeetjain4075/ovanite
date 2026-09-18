import { i as useNavigate, a as useActor, r as reactExports, k as useMutation, j as jsxRuntimeExports, l as Label, I as Input, P as PrimaryButton, d as createActor, e as useSiteContent, C as Container } from "./index-nAhl1N96.js";
import { T as Textarea } from "./textarea-TnSsLILx.js";
import { i as isDuplicateResult, v as validateMessage, a as validateEmail, b as validateName } from "./validation-D1I7ai0A.js";
import { B as Breadcrumbs } from "./Breadcrumbs-C4_qKhBm.js";
import { P as PageMeta } from "./PageMeta-BLn8XJz2.js";
import { r as resolveSiteCopy } from "./siteCopy-yL4ekaS-.js";
const FIELD_IDS = {
  name: "contact-name",
  email: "contact-email",
  message: "contact-message"
};
function ContactForm() {
  const navigate = useNavigate();
  const { actor } = useActor(createActor);
  const [name, setName] = reactExports.useState("");
  const [email, setEmail] = reactExports.useState("");
  const [message, setMessage] = reactExports.useState("");
  const [errors, setErrors] = reactExports.useState({});
  const [alreadyReceived, setAlreadyReceived] = reactExports.useState(false);
  const mutation = useMutation({
    mutationFn: async (input) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.submitContact(input);
    },
    onSuccess: (result) => {
      if (isDuplicateResult(result)) {
        setAlreadyReceived(true);
        return;
      }
      navigate("/thank-you", { state: { kind: "contact" } });
    }
  });
  function validate() {
    const next = {
      name: validateName(name),
      email: validateEmail(email),
      message: validateMessage(message)
    };
    setErrors(next);
    return !next.name && !next.email && !next.message;
  }
  function handleSubmit(event) {
    event.preventDefault();
    setAlreadyReceived(false);
    if (!validate()) return;
    mutation.mutate({
      name: name.trim(),
      email: email.trim(),
      message: message.trim()
    });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "form",
    {
      noValidate: true,
      onSubmit: handleSubmit,
      "data-ocid": "contact.form",
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
              "data-ocid": "contact.name_input",
              className: "h-11 rounded-sm"
            }
          ),
          errors.name ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              id: `${FIELD_IDS.name}-error`,
              role: "alert",
              "data-ocid": "contact.name_error",
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
              "data-ocid": "contact.email_input",
              className: "h-11 rounded-sm"
            }
          ),
          errors.email ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              id: `${FIELD_IDS.email}-error`,
              role: "alert",
              "data-ocid": "contact.email_error",
              className: "mt-2 text-sm text-destructive",
              children: errors.email
            }
          ) : null
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: FIELD_IDS.message, className: "mb-2", children: "Message" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            Textarea,
            {
              id: FIELD_IDS.message,
              name: "message",
              rows: 6,
              value: message,
              onChange: (event) => setMessage(event.target.value),
              "aria-invalid": errors.message ? true : void 0,
              "aria-describedby": errors.message ? `${FIELD_IDS.message}-error` : void 0,
              "data-ocid": "contact.message_textarea",
              className: "min-h-32 rounded-sm"
            }
          ),
          errors.message ? /* @__PURE__ */ jsxRuntimeExports.jsx(
            "p",
            {
              id: `${FIELD_IDS.message}-error`,
              role: "alert",
              "data-ocid": "contact.message_error",
              className: "mt-2 text-sm text-destructive",
              children: errors.message
            }
          ) : null
        ] }),
        alreadyReceived ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "output",
          {
            "aria-live": "polite",
            "data-ocid": "contact.already_received_state",
            className: "block border border-accent/40 bg-accent/5 px-4 py-3 text-sm text-foreground",
            children: "Already received — we have this exact message from you and will reply to it. There is no need to send it again."
          }
        ) : null,
        mutation.isError ? /* @__PURE__ */ jsxRuntimeExports.jsx(
          "p",
          {
            role: "alert",
            "data-ocid": "contact.error_state",
            className: "border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive",
            children: "Something went wrong sending your message. Please try again."
          }
        ) : null,
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          PrimaryButton,
          {
            type: "submit",
            size: "lg",
            disabled: mutation.isPending,
            "data-ocid": "contact.submit_button",
            children: mutation.isPending ? "Sending…" : "Send message"
          }
        )
      ]
    }
  );
}
function Contact() {
  const { data } = useSiteContent();
  const copy = resolveSiteCopy(data);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      PageMeta,
      {
        title: "Contact",
        description: "Start a conversation with Ovanite. Tell us what you are working on and what a good outcome looks like."
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Breadcrumbs, { items: [{ label: "Home", to: "/" }, { label: "Contact" }] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { className: "py-16 md:py-24", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline gap-3 border-t border-border pt-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-xs font-medium tracking-[0.22em] text-primary", children: "01" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "eyebrow", children: "Contact" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-10 grid gap-14 md:grid-cols-12 md:gap-10", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "md:col-span-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-balance font-display text-4xl font-bold tracking-tight md:text-5xl", children: copy.contactTitle }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-6 max-w-md text-pretty text-lg leading-relaxed text-muted-foreground", children: copy.contactBody })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "md:col-span-7", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border border-border bg-card", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4 border-b border-border px-6 py-4 md:px-10", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "eyebrow", children: "New enquiry" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-muted-foreground", children: "Replies within 2 business days" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-6 md:p-10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ContactForm, {}) })
        ] }) })
      ] })
    ] })
  ] });
}
export {
  Contact as default
};
