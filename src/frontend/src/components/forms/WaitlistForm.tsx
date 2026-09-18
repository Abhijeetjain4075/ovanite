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
  validateName,
  validateNote,
} from "@/lib/validation";
import { useActor } from "@caffeineai/core-infrastructure";
import { useMutation } from "@tanstack/react-query";

type WaitlistFields = "name" | "email" | "note";

const FIELD_IDS: Record<WaitlistFields, string> = {
  name: "waitlist-name",
  email: "waitlist-email",
  note: "waitlist-note",
};

/** Accessible waitlist form with inline validation and success routing. */
export function WaitlistForm() {
  const navigate = useNavigate();
  const { actor } = useActor(createActor);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<FieldErrors<WaitlistFields>>({});
  const [alreadyReceived, setAlreadyReceived] = useState(false);

  const mutation = useMutation({
    mutationFn: async (input: {
      name: string;
      email: string;
      note?: string;
    }) => {
      if (!actor) throw new Error("Backend is not ready");
      return actor.submitWaitlist(input);
    },
    onSuccess: (result) => {
      if (isDuplicateResult(result)) {
        setAlreadyReceived(true);
        return;
      }
      navigate("/thank-you", { state: { kind: "waitlist" } });
    },
  });

  function validate(): boolean {
    const next: FieldErrors<WaitlistFields> = {
      name: validateName(name),
      email: validateEmail(email),
      note: validateNote(note),
    };
    setErrors(next);
    return !next.name && !next.email && !next.note;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAlreadyReceived(false);
    if (!validate()) return;
    const trimmedNote = note.trim();
    mutation.mutate({
      name: name.trim(),
      email: email.trim(),
      ...(trimmedNote ? { note: trimmedNote } : {}),
    });
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      data-ocid="waitlist.form"
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
          data-ocid="waitlist.name_input"
          className="h-11 rounded-sm"
        />
        {errors.name ? (
          <p
            id={`${FIELD_IDS.name}-error`}
            role="alert"
            data-ocid="waitlist.name_error"
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
          data-ocid="waitlist.email_input"
          className="h-11 rounded-sm"
        />
        {errors.email ? (
          <p
            id={`${FIELD_IDS.email}-error`}
            role="alert"
            data-ocid="waitlist.email_error"
            className="mt-2 text-sm text-destructive"
          >
            {errors.email}
          </p>
        ) : null}
      </div>

      <div>
        <Label htmlFor={FIELD_IDS.note} className="mb-2">
          Note{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id={FIELD_IDS.note}
          name="note"
          rows={4}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          aria-invalid={errors.note ? true : undefined}
          aria-describedby={errors.note ? `${FIELD_IDS.note}-error` : undefined}
          data-ocid="waitlist.note_textarea"
          className="min-h-24 rounded-sm"
        />
        {errors.note ? (
          <p
            id={`${FIELD_IDS.note}-error`}
            role="alert"
            data-ocid="waitlist.note_error"
            className="mt-2 text-sm text-destructive"
          >
            {errors.note}
          </p>
        ) : null}
      </div>

      {alreadyReceived ? (
        <output
          aria-live="polite"
          data-ocid="waitlist.already_received_state"
          className="block border border-accent/40 bg-accent/5 px-4 py-3 text-sm text-foreground"
        >
          Already received — you are on the list with this exact note. We will
          be in touch when there is something real to share.
        </output>
      ) : null}

      {mutation.isError ? (
        <p
          role="alert"
          data-ocid="waitlist.error_state"
          className="border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          Something went wrong joining the waitlist. Please try again.
        </p>
      ) : null}

      <PrimaryButton
        type="submit"
        size="lg"
        disabled={mutation.isPending}
        data-ocid="waitlist.submit_button"
      >
        {mutation.isPending ? "Joining…" : "Join the waitlist"}
      </PrimaryButton>
    </form>
  );
}
