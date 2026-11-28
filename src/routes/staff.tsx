import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { AppShell, Badge, Card, btnCls, head, inputCls, useSignedInStaff } from "@/components/rc/AppShell";
import { addStaff, editStaff, listStaff, resetPassword, type StaffRow } from "@/lib/api/staff";
import { MIN_PASSWORD, type Role } from "@/lib/staff-rules";

export const Route = createFileRoute("/staff")({
  head: head("Staff logins", "Add, edit and turn off Rama Cares console logins."),
  component: () => (
    <AppShell title="Staff logins" subtitle="Who can sign in to this console. Admins can also manage logins here. Turning a login off or resetting its password signs that person out on every device.">
      <StaffPage />
    </AppShell>
  ),
});

type Result = { ok: true } | { ok: false; error: string };
const ROLE_LABEL: Record<Role, string> = { admin: "Admin", staff: "Staff" };
const btnGhost = "rounded-md border border-input px-3 py-1.5 text-xs hover:bg-muted disabled:opacity-50";

function StaffPage() {
  const me = useSignedInStaff();
  const [rows, setRows] = useState<StaffRow[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const refresh = () => listStaff().then(setRows, () => setLoadError(true));
  useEffect(() => {
    if (me?.role === "admin") void refresh();
  }, [me?.role]);

  if (me?.role !== "admin") return <Card><p className="text-sm text-muted-foreground">Only admins can manage staff logins. Ask the owner if you need a login changed.</p></Card>;
  if (loadError) return <p className="text-sm text-destructive">Couldn't load staff logins. Refresh to try again.</p>;
  if (!rows) return <p className="text-sm text-muted-foreground">Loading…</p>;
  return (
    <>
      <AddStaff onAdded={refresh} />
      <div className="mt-6 space-y-3">
        {rows.map((r) => <StaffCard key={r.id} row={r} isSelf={r.id === me.id} onChanged={refresh} />)}
      </div>
    </>
  );
}

function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const go = async (fn: () => Promise<Result>, onOk: () => void) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fn();
      if (res.ok) onOk();
      else setError(res.error);
    } catch {
      setError("Couldn't save just now. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, go };
}

function AddStaff({ onAdded }: { onAdded: () => void }) {
  const empty = { name: "", email: "", phone: "", role: "staff" as Role, password: "" };
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(empty);
  const [done, setDone] = useState<string | null>(null);
  const { busy, error, go } = useAction();
  const submit = (e: FormEvent) => {
    e.preventDefault();
    void go(() => addStaff({ data: f }), () => { setDone(f.email); setF(empty); setOpen(false); onAdded(); });
  };
  if (!open)
    return (
      <div className="flex flex-wrap items-center gap-4">
        <button className={btnCls} onClick={() => { setOpen(true); setDone(null); }}>Add a staff login</button>
        {done && <p role="status" className="text-sm text-success">Login created for {done}. Share the password with them privately (in person or by phone).</p>}
      </div>
    );
  return (
    <Card>
      <form onSubmit={submit}>
        <h2 className="font-display text-lg">New staff login</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm">Full name<input required className={`mt-1 ${inputCls}`} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
          <label className="text-sm">Email (used to sign in)<input required type="email" autoComplete="off" className={`mt-1 ${inputCls}`} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
          <label className="text-sm">Mobile for sign-in codes<input type="tel" placeholder="98765 43210" className={`mt-1 ${inputCls}`} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
          <label className="text-sm">Role
            <select className={`mt-1 ${inputCls}`} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as Role })}>
              <option value="staff">Staff — uses the console</option>
              <option value="admin">Admin — can also manage logins</option>
            </select>
          </label>
          <label className="text-sm md:col-span-2">Temporary password (at least {MIN_PASSWORD} characters)
            <input required type="text" autoComplete="new-password" minLength={MIN_PASSWORD} className={`mt-1 ${inputCls} font-mono`} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
          </label>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">With a mobile number, they'll also need an SMS code to sign in. While Twilio is on its trial plan, the number must first be verified in the Rama Cares Twilio account.</p>
        {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
        <div className="mt-4 flex gap-2">
          <button type="submit" disabled={busy} className={btnCls}>{busy ? "Creating…" : "Create login"}</button>
          <button type="button" className={btnGhost} onClick={() => setOpen(false)}>Cancel</button>
        </div>
      </form>
    </Card>
  );
}

function StaffCard({ row, isSelf, onChanged }: { row: StaffRow; isSelf: boolean; onChanged: () => void }) {
  const [mode, setMode] = useState<"view" | "edit" | "password">("view");
  const [f, setF] = useState({ name: row.name, phone: row.phone ?? "", role: row.role });
  const [pw, setPw] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const { busy, error, go } = useAction();
  const save = (active: boolean, msg: string) =>
    go(() => editStaff({ data: { id: row.id, ...f, active } }), () => { setMode("view"); setNotice(msg); onChanged(); });

  return (
    <Card className={row.active ? "" : "opacity-70"}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-medium">{row.name}{isSelf && <span className="text-muted-foreground"> (you)</span>}</h3>
          <p className="text-sm text-muted-foreground">{row.email}{row.phone ? ` · SMS code to ${row.phone}` : " · password only (no mobile on file)"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={row.role === "admin" ? "primary" : "muted"}>{ROLE_LABEL[row.role]}</Badge>
          {!row.active && <Badge tone="red">Turned off</Badge>}
          {row.active && row.locked && <Badge tone="amber">Locked — too many wrong passwords</Badge>}
        </div>
      </div>

      {mode === "view" && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button className={btnGhost} onClick={() => { setMode("edit"); setNotice(null); }}>Edit</button>
          <button className={btnGhost} onClick={() => { setMode("password"); setPw(""); setNotice(null); }}>Reset password</button>
          {row.active && !isSelf && (
            <button className={`${btnGhost} text-destructive`} disabled={busy} onClick={() => save(false, `${row.name} is signed out and can't sign in until turned back on.`)}>Turn off login</button>
          )}
          {!row.active && (
            <button className={btnGhost} disabled={busy} onClick={() => save(true, `${row.name} can sign in again.`)}>Turn login back on</button>
          )}
        </div>
      )}

      {mode === "edit" && (
        <form className="mt-4" onSubmit={(e) => { e.preventDefault(); void save(row.active, "Saved."); }}>
          <div className="grid gap-3 md:grid-cols-3">
            <label className="text-sm">Full name<input required className={`mt-1 ${inputCls}`} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
            <label className="text-sm">Mobile for sign-in codes<input type="tel" placeholder="Leave empty for password only" className={`mt-1 ${inputCls}`} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></label>
            <label className="text-sm">Role
              <select className={`mt-1 ${inputCls}`} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as Role })}>
                <option value="staff">Staff</option><option value="admin">Admin</option>
              </select>
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <button type="submit" disabled={busy} className={btnCls}>{busy ? "Saving…" : "Save"}</button>
            <button type="button" className={btnGhost} onClick={() => { setMode("view"); setF({ name: row.name, phone: row.phone ?? "", role: row.role }); }}>Cancel</button>
          </div>
        </form>
      )}

      {mode === "password" && (
        <form className="mt-4" onSubmit={(e) => { e.preventDefault(); void go(() => resetPassword({ data: { id: row.id, password: pw } }), () => { setMode("view"); setNotice(isSelf ? "Password changed. Sign in again with the new password." : `Password reset and ${row.name} is signed out. Share the new password with them privately.`); if (isSelf) window.location.reload(); else onChanged(); }); }}>
          <label className="block max-w-md text-sm">New password (at least {MIN_PASSWORD} characters)
            <input required type="text" autoComplete="new-password" minLength={MIN_PASSWORD} className={`mt-1 ${inputCls} font-mono`} value={pw} onChange={(e) => setPw(e.target.value)} />
          </label>
          <p className="mt-2 text-xs text-muted-foreground">This also unlocks the login and signs {isSelf ? "you" : "them"} out on every device.</p>
          <div className="mt-3 flex gap-2">
            <button type="submit" disabled={busy} className={btnCls}>{busy ? "Saving…" : "Set new password"}</button>
            <button type="button" className={btnGhost} onClick={() => setMode("view")}>Cancel</button>
          </div>
        </form>
      )}

      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      {notice && <p role="status" className="mt-3 text-sm text-success">{notice}</p>}
    </Card>
  );
}
