"use client";

import * as React from "react";
import {
  createStaffUserAction,
  toggleBanStaffUserAction,
  resetStaffPasswordAction,
} from "@/app/actions/admin";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Ban,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

export interface StaffUserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean;
  createdAt: string; // ISO
}

interface StaffManagerProps {
  initialUsers: StaffUserRecord[];
  currentUserId: string;
}

export function StaffManager({ initialUsers, currentUserId }: StaffManagerProps) {
  const [users, setUsers] = React.useState<StaffUserRecord[]>(initialUsers);

  // Create Staff Modal
  const [createOpen, setCreateOpen] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newEmail, setNewEmail] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [newRole, setNewRole] = React.useState<"admin" | "receptionist">("receptionist");

  // Reset Password Modal
  const [resetOpen, setResetOpen] = React.useState(false);
  const [targetUser, setTargetUser] = React.useState<StaffUserRecord | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Create User
  async function handleCreateStaff(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await createStaffUserAction({
      name: newName,
      email: newEmail,
      password: newPassword,
      role: newRole,
    });

    setLoading(false);

    if (res.success) {
      setCreateOpen(false);
      window.location.reload();
    } else {
      setError(res.error || "Failed to create staff account.");
    }
  }

  // Toggle Ban
  async function handleToggleBan(user: StaffUserRecord) {
    if (user.id === currentUserId) return;
    setLoading(true);
    const newBannedState = !user.banned;
    await toggleBanStaffUserAction({
      userId: user.id,
      banned: newBannedState,
    });
    setLoading(false);
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, banned: newBannedState } : u))
    );
  }

  // Reset Password
  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!targetUser) return;

    setLoading(true);
    setError(null);

    const res = await resetStaffPasswordAction({
      userId: targetUser.id,
      newPassword: resetPasswordVal,
    });

    setLoading(false);

    if (res.success) {
      setResetOpen(false);
      setResetPasswordVal("");
    } else {
      setError(res.error || "Failed to reset password.");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight sm:text-3xl">
            Staff & Receptionist Accounts
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Admin privilege: Provision receptionist logins, deactivate staff, and manage credentials.
          </p>
        </div>

        <Button
          onClick={() => {
            setNewName("");
            setNewEmail("");
            setNewPassword("");
            setNewRole("receptionist");
            setError(null);
            setCreateOpen(true);
          }}
          size="sm"
          className="rounded-xl flex items-center gap-1.5 text-xs font-semibold shadow-xs"
        >
          <UserPlus className="h-3.5 w-3.5" />
          <span>Provision New Staff Login</span>
        </Button>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-xs overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs font-bold uppercase">Staff Name</TableHead>
              <TableHead className="text-xs font-bold uppercase">Email Address</TableHead>
              <TableHead className="text-xs font-bold uppercase">Assigned Role</TableHead>
              <TableHead className="text-xs font-bold uppercase">Account Status</TableHead>
              <TableHead className="text-right text-xs font-bold uppercase">Manage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const isSelf = u.id === currentUserId;

              return (
                <TableRow key={u.id} className="hover:bg-muted/20">
                  <TableCell className="font-bold text-xs text-foreground">
                    {u.name} {isSelf && <span className="text-[10px] text-primary font-normal">(You)</span>}
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground font-mono">
                    {u.email}
                  </TableCell>

                  <TableCell>
                    <Badge variant={u.role === "admin" ? "default" : "secondary"} className="text-[10px] uppercase font-bold">
                      {u.role}
                    </Badge>
                  </TableCell>

                  <TableCell>
                    {u.banned ? (
                      <Badge variant="destructive" className="text-[10px] font-semibold gap-1">
                        <Ban className="h-3 w-3" />
                        <span>Deactivated</span>
                      </Badge>
                    ) : (
                      <Badge variant="success" className="text-[10px] font-semibold gap-1">
                        <CheckCircle className="h-3 w-3" />
                        <span>Active</span>
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTargetUser(u);
                        setResetPasswordVal("");
                        setError(null);
                        setResetOpen(true);
                      }}
                      className="rounded-lg text-xs h-7"
                    >
                      <KeyRound className="h-3 w-3 mr-1" />
                      <span>Password</span>
                    </Button>

                    {!isSelf && (
                      <Button
                        variant={u.banned ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handleToggleBan(u)}
                        className={`rounded-lg text-xs h-7 ${u.banned ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "text-destructive hover:bg-destructive/10"}`}
                      >
                        {u.banned ? "Reactivate" : "Deactivate"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Modal: Create Staff */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogHeader>
          <DialogTitle>Provision Staff Account</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleCreateStaff} className="space-y-4 py-2 text-xs">
          {error && <p className="text-destructive font-semibold text-xs">{error}</p>}

          <div>
            <Label className="text-xs font-semibold">Staff Full Name *</Label>
            <Input
              required
              placeholder="e.g. Priya Sharma"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold">Email Address *</Label>
            <Input
              type="email"
              required
              placeholder="priya@clinic.local"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold">Initial Password * (min 8 chars)</Label>
            <Input
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-xs font-semibold">Role & Permissions</Label>
            <Select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as any)}
              className="mt-1"
            >
              <option value="receptionist">Receptionist (Appointments & Today Desk only)</option>
              <option value="admin">Administrator (Full Access)</option>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Account"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Modal: Reset Password */}
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogHeader>
          <DialogTitle>Reset Password for {targetUser?.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleResetPassword} className="space-y-4 py-2 text-xs">
          {error && <p className="text-destructive font-semibold text-xs">{error}</p>}

          <p className="text-muted-foreground text-xs">
            Enter a new password for <strong className="text-foreground">{targetUser?.email}</strong>.
          </p>

          <div>
            <Label className="text-xs font-semibold">New Password (min 8 chars) *</Label>
            <Input
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
              value={resetPasswordVal}
              onChange={(e) => setResetPasswordVal(e.target.value)}
              className="mt-1"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
