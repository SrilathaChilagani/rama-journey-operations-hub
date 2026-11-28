import { describe, expect, it } from "vitest";
import { passwordProblem, staffChangeBlockReason } from "./staff-rules";

const base = { isSelf: false, targetIsActiveAdmin: false, activeAdmins: 2, newRole: "staff" as const, newActive: true };

describe("staff rules", () => {
  it("allows ordinary changes to a staff login", () => {
    expect(staffChangeBlockReason(base)).toBeNull();
    expect(staffChangeBlockReason({ ...base, newActive: false })).toBeNull();
  });
  it("stops admins turning off their own login or dropping their own admin rights", () => {
    expect(staffChangeBlockReason({ ...base, isSelf: true, targetIsActiveAdmin: true, newRole: "admin", newActive: false })).toMatch(/own login/);
    expect(staffChangeBlockReason({ ...base, isSelf: true, targetIsActiveAdmin: true })).toMatch(/own admin/);
  });
  it("always keeps at least one active admin", () => {
    expect(staffChangeBlockReason({ ...base, targetIsActiveAdmin: true, activeAdmins: 1 })).toMatch(/at least one/);
    expect(staffChangeBlockReason({ ...base, targetIsActiveAdmin: true, activeAdmins: 2 })).toBeNull();
  });
  it("lets an admin keep editing their own name and phone", () => {
    expect(staffChangeBlockReason({ ...base, isSelf: true, targetIsActiveAdmin: true, activeAdmins: 1, newRole: "admin" })).toBeNull();
  });
  it("requires passwords of at least 10 characters", () => {
    expect(passwordProblem("short")).toMatch(/10/);
    expect(passwordProblem("long-enough-pw")).toBeNull();
  });
});
