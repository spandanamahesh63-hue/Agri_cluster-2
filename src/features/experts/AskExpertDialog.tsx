import { useState, type FormEvent } from "react";
import type { Consultation, Expert, Field } from "../../types";
import { useAppStore } from "../../store/AppStore";
import { Dialog } from "../../components/modals/Dialog";
import { Button } from "../../components/ui/Button";
import { InfoNote } from "../../components/ui/Badge";
import { ChoiceCards, FormField, SelectInput, TextArea, TextInput } from "../../components/forms/fields";
import { useToast } from "../../components/ui/Toast";
import { DEMO_TOMORROW } from "../../data/mock/clock";
import { formatINR } from "../../utils/format";

interface Props {
  expert: Expert;
  fields: Field[];
  initialFieldId?: string;
  initialMessage?: string;
  initialKind?: Consultation["kind"];
  onClose: () => void;
}

export function AskExpertDialog({ expert, fields, initialFieldId, initialMessage, initialKind = "question", onClose }: Props) {
  const { session, addConsultation } = useAppStore();
  const toast = useToast();
  const [kind, setKind] = useState<Consultation["kind"]>(initialKind);
  const [fieldId, setFieldId] = useState(initialFieldId ?? "");
  const [message, setMessage] = useState(initialMessage ?? "");
  const [date, setDate] = useState(DEMO_TOMORROW);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 10) return setError("Describe what you are seeing in a sentence or two.");
    addConsultation({
      expertId: expert.id,
      requesterUserId: session!.userId,
      kind,
      topic: expert.title,
      message: message.trim(),
      fieldId: fieldId || undefined,
      preferredDate: kind === "consultation" ? date : undefined,
    });
    toast(kind === "question" ? `Question sent to ${expert.name}.` : `Consultation request sent to ${expert.name}.`);
    onClose();
  };

  return (
    <Dialog
      title={`Contact ${expert.name}`}
      description={`${expert.title} · ${expert.responseTime.toLowerCase()}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="ask-expert">
            {kind === "question" ? "Send question" : "Request consultation"}
          </Button>
        </>
      }
    >
      <form id="ask-expert" onSubmit={submit} noValidate className="space-y-4">
        <ChoiceCards
          legend="How can they help?"
          name="kind"
          value={kind}
          onChange={setKind}
          columns={2}
          options={[
            { id: "question", title: "Ask a question", description: "Free through the cluster" },
            { id: "consultation", title: "Book a consultation", description: `Call or field visit · ${formatINR(expert.consultationFee)} (indicative)` },
          ]}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="About which field?">
            {(p) => (
              <SelectInput {...p} value={fieldId} onChange={(e) => setFieldId(e.target.value)}>
                <option value="">General question</option>
                {fields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </SelectInput>
            )}
          </FormField>
          {kind === "consultation" && (
            <FormField label="Preferred date">
              {(p) => <TextInput {...p} type="date" min={DEMO_TOMORROW} value={date} onChange={(e) => setDate(e.target.value)} />}
            </FormField>
          )}
        </div>
        <FormField label="Your question" error={error} hint="What you see, since when, and what you have already tried.">
          {(p) => (
            <TextArea
              {...p}
              rows={5}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                setError(null);
              }}
            />
          )}
        </FormField>
        <InfoNote>
          The expert sees your farm label, your message and the field you choose, only what the consultation needs. Your finances and contact details are not
          shared.
        </InfoNote>
      </form>
    </Dialog>
  );
}
