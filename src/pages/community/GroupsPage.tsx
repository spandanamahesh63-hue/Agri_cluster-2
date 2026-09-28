import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { useAppStore } from "../../store/AppStore";
import { GroupRow } from "../../features/community/EventRow";
import { villageNames } from "../../data/mock/clusterFarms";
import { PageHeader } from "../../components/ui/PageHeader";
import { Card } from "../../components/ui/Card";
import { InfoNote } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Dialog } from "../../components/modals/Dialog";
import { EmptyState } from "../../components/ui/states";
import { FormField, SelectInput, TextArea, TextInput } from "../../components/forms/fields";
import { useToast } from "../../components/ui/Toast";

const focusOptions = ["Tomato & vegetables", "Organic farming", "Irrigation & water saving", "Millets", "Joint selling", "Women farmers"];

/** Farmer groups and local farming communities (spec §17). */
export function GroupsPage() {
  const { groups } = useAppStore();
  const [adding, setAdding] = useState(false);
  const sorted = [...groups].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <PageHeader
        title="Groups"
        description="Which farmer groups are you running?"
        actions={
          <Button icon={<Plus aria-hidden className="size-4" />} onClick={() => setAdding(true)}>
            Start a group
          </Button>
        }
      />
      {sorted.length === 0 ? (
        <Card>
          <EmptyState title="No groups yet" description="Start a group for farmers in one village or with one shared goal." />
        </Card>
      ) : (
        <Card>
          <ul className="divide-y divide-line">
            {sorted.map((g) => (
              <GroupRow key={g.id} group={g} />
            ))}
          </ul>
        </Card>
      )}
      <InfoNote className="mt-4">Groups show farm labels, not farmers' names or phone numbers. Members choose to join.</InfoNote>
      {adding && <NewGroupDialog onClose={() => setAdding(false)} />}
    </>
  );
}

function NewGroupDialog({ onClose }: { onClose: () => void }) {
  const { session, addGroup } = useAppStore();
  const toast = useToast();
  const [name, setName] = useState("");
  const [village, setVillage] = useState("Chamarajanagara");
  const [focus, setFocus] = useState(focusOptions[0]);
  const [meets, setMeets] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 4) return setError("Give the group a name farmers will recognise.");
    addGroup({
      name: name.trim(),
      village,
      focus,
      description: description.trim() || `Farmers in ${village} working on ${focus.toLowerCase()}.`,
      organiserUserId: session!.userId,
      baseMembers: 0,
      memberUserIds: [],
      meets: meets.trim() || "To be decided",
    });
    toast(`${name.trim()} created. Farmers can now join it.`);
    onClose();
  };

  return (
    <Dialog
      title="Start a group"
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="new-group">
            Create group
          </Button>
        </>
      }
    >
      <form id="new-group" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <FormField label="Group name" error={error} className="sm:col-span-2">
          {(p) => <TextInput {...p} value={name} placeholder="e.g. Jayapura Millet Growers" onChange={(e) => (setName(e.target.value), setError(null))} />}
        </FormField>
        <FormField label="Village">
          {(p) => (
            <SelectInput {...p} value={village} onChange={(e) => setVillage(e.target.value)}>
              {villageNames.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </SelectInput>
          )}
        </FormField>
        <FormField label="Focus">
          {(p) => (
            <SelectInput {...p} value={focus} onChange={(e) => setFocus(e.target.value)}>
              {focusOptions.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </SelectInput>
          )}
        </FormField>
        <FormField label="When it meets" hint="Optional" className="sm:col-span-2">
          {(p) => <TextInput {...p} value={meets} placeholder="e.g. Saturdays, 5 pm" onChange={(e) => setMeets(e.target.value)} />}
        </FormField>
        <FormField label="What the group does" hint="Optional" className="sm:col-span-2">
          {(p) => <TextArea {...p} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />}
        </FormField>
      </form>
    </Dialog>
  );
}
