import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { createActor } from "@/backend";
import { PrimaryButton } from "@/components/shared/primitives";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  type FieldErrors,
  isDuplicateResult,
  validateEmail,
  validateMessage,
  validateName,
} from "@/lib/validation";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation } from "@tanstack/react-query";

type ContactFields = "name" | "email" | "message";

const FIELD_IDS: Record<ContactFields, string> = {
  name: "contact-name",
  email: "contact-email",
  message: "contact-message",
};

/** Accessible contact form with inline validation and success routing. */
export function ContactForm() {
  const navigate = useNavigate();
  const { actor } = useActor(createActor);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<FieldErrors<ContactFields>>({});
  const [alreadyReceived, setAlreadyReceived] = useState(false);

  const mutation = useMutation({
    mutationFn: async (input: {
      name: string;
      email: string;
      message: string;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.submitContact(input);
    },
    onSuccess: (result) => {
      if (isDuplicateResult(result)) {
        setAlreadyReceived(true);
        return;
      }
      navigate("/thank-you", { state: { kind: "contact" } });
    },
  });

  function validate(): boolean {
    const next: FieldErrors<ContactFields> = {
      name: validateName(name),
      email: validateEmail(email),
      message: validateMessage(message),
    };
    setErrors(next);
    return !next.name && !next.email && !next.message;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAlreadyReceived(false);
    if (!validate()) return;
    mutation.mutate({
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    });
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      data-ocid="contact.form"
      className="space-y-6"
    >
      <div>
        <Label htmlFor={FIELD_IDS.name} className="mb-2">
          Name
        </Label>
        <Input
          id={FIELD_IDS.name}
          name="name"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={errors.name ? `${FIELD_IDS.name}-error` : undefined}
          data-ocid="contact.name_input"
          className="h-11 rounded-sm"
        />
        {errors.name ? (
          <p
            id={`${FIELD_IDS.name}-error`}
            role="alert"
            data-ocid="contact.name_error"
            className="mt-2 text-sm text-destructive"
          >
            {errors.name}
          </p>
        ) : null}
      </div>

      <div>
        <Label htmlFor={FIELD_IDS.email} className="mb-2">
          Email
        </Label>
        <Input
          id={FIELD_IDS.email}
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={
            errors.email ? `${FIELD_IDS.email}-error` : undefined
          }
          data-ocid="contact.email_input"
          className="h-11 rounded-sm"
        />
        {errors.email ? (
          <p
            id={`${FIELD_IDS.email}-error`}
            role="alert"
            data-ocid="contact.email_error"
            className="mt-2 text-sm text-destructive"
          >
            {errors.email}
          </p>
        ) : null}
      </div>

      <div>
        <Label htmlFor={FIELD_IDS.message} className="mb-2">
          Message
        </Label>
        <Textarea
          id={FIELD_IDS.message}
          name="message"
          rows={6}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          aria-invalid={errors.message ? true : undefined}
          aria-describedby={
            errors.message ? `${FIELD_IDS.message}-error` : undefined
          }
          data-ocid="contact.message_textarea"
          className="min-h-32 rounded-sm"
        />
        {errors.message ? (
          <p
            id={`${FIELD_IDS.message}-error`}
            role="alert"
            data-ocid="contact.message_error"
            className="mt-2 text-sm text-destructive"
          >
            {errors.message}
          </p>
        ) : null}
      </div>

      {alreadyReceived ? (
        <output
          aria-live="polite"
          data-ocid="contact.already_received_state"
          className="block border border-accent/40 bg-accent/5 px-4 py-3 text-sm text-foreground"
        >
          Already received — we have this exact message from you and will reply
          to it. There is no need to send it again.
        </output>
      ) : null}

      {mutation.isError ? (
        <p
          role="alert"
          data-ocid="contact.error_state"
          className="border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          Something went wrong sending your message. Please try again.
        </p>
      ) : null}

      <PrimaryButton
        type="submit"
        size="lg"
        disabled={mutation.isPending}
        data-ocid="contact.submit_button"
      >
        {mutation.isPending ? "Sending…" : "Send message"}
      </PrimaryButton>
    </form>
  );
}
