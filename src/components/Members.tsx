import { useState } from "react";
import { UserPlus, Search, X } from "lucide-react";
import { Badge, Button, Input, PageShell, Field, Select, Alert } from "./ui";
import { useData } from "../DataContext";

export default function Members() {
  const { members, loading, createMember } = useData();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState("Member");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filtered = members.filter(
    (m: any) =>
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.role?.toLowerCase().includes(search.toLowerCase()) ||
      m.id?.toLowerCase().includes(search.toLowerCase())
  );

  const roleBadge = (role: string) => {
    if (role === "Group Leader") return <Badge variant="completed">{role}</Badge>;
    if (role === "Treasurer") return <Badge variant="pending">{role}</Badge>;
    if (role === "Auditor") return <Badge variant="review">{role}</Badge>;
    return <span className="text-xs text-[#6b7280]">{role}</span>;
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await createMember({
        name,
        role,
        phone,
      });
      setName("");
      setPhone("");
      setRole("Member");
      setShowAdd(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to add member.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold text-[#111827]">Members</h1>
          <p className="text-xs text-[#6b7280] mt-0.5">Maa Durga SHG &mdash; {members.length} registered members</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)}>
          <UserPlus size={13} /> {showAdd ? "Close" : "Add member"}
        </Button>
      </div>

      {showAdd && (
        <div className="bg-white border border-[#e5e7eb] rounded-[8px] p-5 mb-5 shadow-sm max-w-lg">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#111827]">Add New SHG Member</h2>
            <button
              onClick={() => setShowAdd(false)}
              className="text-[#9ca3af] hover:text-[#374151] cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
          {errorMsg && (
            <div className="mb-3">
              <Alert variant="danger" title="Error">
                {errorMsg}
              </Alert>
            </div>
          )}
          <form onSubmit={handleAddMember} className="space-y-3">
            <Field label="Full name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kaushalya Devi"
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Role">
                <Select value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="Member">Member</option>
                  <option value="Group Leader">Group Leader</option>
                  <option value="Treasurer">Treasurer</option>
                  <option value="Auditor">Auditor</option>
                </Select>
              </Field>
              <Field label="Mobile (optional)">
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit number"
                />
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!name || submitting}>
                {submitting ? "Saving…" : "Save Member"}
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="relative mb-4 max-w-xs">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search members…" className="pl-8" />
      </div>

      <div className="bg-white border border-[#e5e7eb] rounded-[6px] overflow-hidden">
        {loading ? (
          <div className="px-4 py-8 text-center text-xs text-[#9ca3af]">Loading members…</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Member</th>
                <th>Role</th>
                <th>Status</th>
                <th className="text-right">Transactions</th>
                <th className="text-right">Approvals</th>
                <th>Last activity</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m: any) => (
                <tr key={m.id}>
                  <td><code className="mono text-[#9ca3af]">{m.id}</code></td>
                  <td className="font-medium">{m.name}</td>
                  <td>{roleBadge(m.role)}</td>
                  <td><Badge variant={m.status === "Active" ? "verified" : "pending"}>{m.status}</Badge></td>
                  <td className="text-right tabular-nums text-[#374151]">{m.transactions || 0}</td>
                  <td className="text-right tabular-nums text-[#374151]">{m.approvals > 0 ? m.approvals : "—"}</td>
                  <td className="text-[#6b7280]">{m.lastActivity || "—"}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-6 text-xs text-[#9ca3af]">
                    No members match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </PageShell>
  );
}
