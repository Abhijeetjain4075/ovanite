import { useState } from "react";

import { PrimaryButton, SecondaryButton } from "@/components/shared/primitives";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Faq, FaqInput } from "@/types/content";

type FaqFormProps = {
  /** Existing FAQ when editing; omit to create. */
  faq?: Faq;
  onSubmit: (input: FaqInput) => void;
  onCancel: () => void;
  isPending: boolean;
  errorMessage?: string;
};

function parseSortOrder(value: string): bigint {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) return 0n;
  return BigInt(parsed);
}

/** Create/edit form for a single FAQ entry. */
export function FaqForm({
  faq,
  onSubmit,
  onCancel,
  isPending,
  errorMessage,
}: FaqFormProps) {
  const [question, setQuestion] = useState(faq?.question ?? "");
  const [answer, setAnswer] = useState(faq?.answer ?? "");
  const [sortOrder, setSortOrder] = useState(faq ? String(faq.sortOrder) : "0");

  const questionError =
    question.trim() === "" ? "A question is required." : null;
  const answerError = answer.trim() === "" ? "An answer is required." : null;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (questionError || answerError) return;
    onSubmit({
      question: question.trim(),
      answer: answer.trim(),
      sortOrder: parseSortOrder(sortOrder),
    });
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      data-ocid="admin.faq_form"
      className="space-y-6 border border-border bg-card p-6 md:p-8"
    >
      <div>
        <Label htmlFor="faq-question" className="mb-2">
          Question
        </Label>
        <Input
          id="faq-question"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          aria-invalid={questionError ? true : undefined}
          aria-describedby={questionError ? "faq-question-error" : undefined}
          data-ocid="admin.faq.question_input"
          className="h-11 rounded-sm"
        />
        {questionError ? (
          <p
            id="faq-question-error"
            role="alert"
            data-ocid="admin.faq.question_error"
            className="mt-2 text-sm text-destructive"
          >
            {questionError}
          </p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="faq-answer" className="mb-2">
          Answer
        </Label>
        <Textarea
          id="faq-answer"
          rows={5}
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          aria-invalid={answerError ? true : undefined}
          aria-describedby={answerError ? "faq-answer-error" : undefined}
          data-ocid="admin.faq.answer_textarea"
          className="min-h-32 rounded-sm"
        />
        {answerError ? (
          <p
            id="faq-answer-error"
            role="alert"
            data-ocid="admin.faq.answer_error"
            className="mt-2 text-sm text-destructive"
          >
            {answerError}
          </p>
        ) : null}
      </div>

      <div className="max-w-xs">
        <Label htmlFor="faq-sort-order" className="mb-2">
          Order
        </Label>
        <Input
          id="faq-sort-order"
          type="number"
          min={0}
          inputMode="numeric"
          value={sortOrder}
          onChange={(event) => setSortOrder(event.target.value)}
          data-ocid="admin.faq.sort_order_input"
          className="h-11 rounded-sm"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Lower numbers appear first.
        </p>
      </div>

      {errorMessage ? (
        <p
          role="alert"
          data-ocid="admin.faq.form_error"
          className="border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          {errorMessage}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3 border-t border-border pt-6">
        <PrimaryButton
          type="submit"
          disabled={isPending}
          data-ocid="admin.faq.submit_button"
        >
          {isPending ? "Saving…" : faq ? "Save changes" : "Create FAQ"}
        </PrimaryButton>
        <SecondaryButton
          type="button"
          onClick={onCancel}
          disabled={isPending}
          data-ocid="admin.faq.cancel_button"
        >
          Cancel
        </SecondaryButton>
      </div>
    </form>
  );
}
