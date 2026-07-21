"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { FamilyGroup, Invoice, MySubscription } from "@driving-test-app/shared";
import HeadingSmall from "@/components/settings/HeadingSmall";
import SettingsLayout from "@/components/settings/SettingsLayout";
import Button from "@/components/ui/Button";
import InputError from "@/components/ui/InputError";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api, ApiError } from "@/lib/api";

const TIER_LABELS: Record<string, string> = {
  guest: "Guest",
  free: "Free",
  weekly_subscriber: "Weekly",
  monthly_subscriber: "Monthly",
  lifetime_family_owner: "Lifetime Family (owner)",
  lifetime_family_member: "Lifetime Family (member)",
};

export default function BillingSettingsPage() {
  const [subscription, setSubscription] = useState<MySubscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [family, setFamily] = useState<FamilyGroup | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const [portalLoading, setPortalLoading] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteErrors, setInviteErrors] = useState<Record<string, string[]>>({});

  function loadAll() {
    api.get<MySubscription>("/billing/subscription").then(setSubscription).catch(() => setLoadError("Couldn't load your subscription."));
    api.get<{ data: Invoice[] }>("/billing/invoices").then((res) => setInvoices(res.data)).catch(() => setInvoices([]));
    api.get<{ family_group: FamilyGroup | null }>("/billing/family").then((res) => setFamily(res.family_group)).catch(() => setFamily(null));
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleCancel() {
    setCanceling(true);
    setCancelError(null);
    try {
      await api.post("/billing/subscription/cancel");
      setConfirmingCancel(false);
      loadAll();
    } catch (err) {
      setCancelError(err instanceof ApiError ? err.message : "Couldn't cancel your subscription. Please try again.");
    } finally {
      setCanceling(false);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const res = await api.get<{ portal_url: string }>("/billing/portal");
      window.location.href = res.portal_url;
    } catch {
      setPortalLoading(false);
    }
  }

  async function handleInvite(e: FormEvent) {
    e.preventDefault();
    setInviting(true);
    setInviteErrors({});
    try {
      await api.post("/billing/family/invite", { email: inviteEmail });
      setInviteEmail("");
      loadAll();
    } catch (err) {
      if (err instanceof ApiError && err.errors) setInviteErrors(err.errors);
    } finally {
      setInviting(false);
    }
  }

  async function handleRevoke(memberId: number) {
    try {
      await api.delete(`/billing/family/members/${memberId}`);
      loadAll();
    } catch {
      // surfaced implicitly — roster just won't update
    }
  }

  const isOwner = subscription?.tier === "lifetime_family_owner";

  return (
    <SettingsLayout>
      <div className="space-y-10">
        <div className="space-y-6">
          <HeadingSmall title="Your plan" description="Manage your subscription and billing" />

          {loadError && <p className="text-sm text-destructive">{loadError}</p>}

          {subscription && (
            <div className="space-y-3 rounded-2xl border p-5">
              <p className="text-sm">
                <span className="font-semibold">Plan: </span>
                {TIER_LABELS[subscription.tier] ?? subscription.tier}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Status: </span>
                {subscription.status}
              </p>
              {subscription.subscription?.canceled && subscription.access_until && (
                <p className="text-sm text-muted-foreground">
                  Access continues until {new Date(subscription.access_until).toLocaleDateString()}.
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-2">
                {!subscription.is_premium && <Button href="/pricing">View plans</Button>}

                {subscription.subscription && !subscription.subscription.canceled && (
                  <Button variant="outline" onClick={handlePortal} disabled={portalLoading}>
                    {portalLoading ? "Redirecting…" : "Manage payment method & invoices"}
                  </Button>
                )}

                {subscription.subscription && !subscription.subscription.canceled && !confirmingCancel && (
                  <Button variant="outline" onClick={() => setConfirmingCancel(true)}>
                    Cancel subscription
                  </Button>
                )}
              </div>

              {confirmingCancel && (
                <div className="space-y-2 rounded-lg bg-muted p-4">
                  <p className="text-sm">
                    Cancel your subscription? You&apos;ll keep access until the end of your current billing period.
                  </p>
                  {cancelError && <p className="text-sm text-destructive">{cancelError}</p>}
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handleCancel} disabled={canceling}>
                      {canceling ? "Canceling…" : "Yes, cancel"}
                    </Button>
                    <Button variant="outline" onClick={() => setConfirmingCancel(false)}>
                      Never mind
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <HeadingSmall title="Invoices" description="Your billing history" />
          {invoices && invoices.length === 0 && <p className="text-sm text-muted-foreground">No invoices yet.</p>}
          {invoices && invoices.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>{new Date(invoice.date).toLocaleDateString()}</TableCell>
                    <TableCell>{invoice.total}</TableCell>
                    <TableCell>{invoice.status}</TableCell>
                    <TableCell>
                      {invoice.hosted_invoice_url && (
                        <a href={invoice.hosted_invoice_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                          View
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {family && (
          <div className="space-y-4">
            <HeadingSmall title="Family plan seats" description={`${family.members.length} of ${family.max_seats} seats used`} />

            <div className="space-y-2">
              {family.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                  <div>
                    <p className="font-medium">{member.user?.name ?? member.invited_email}</p>
                    <p className="text-muted-foreground">
                      {member.role === "owner" ? "Owner" : "Member"} · {member.invite_status}
                    </p>
                  </div>
                  {isOwner && member.role !== "owner" && member.invite_status !== "revoked" && (
                    <Button variant="outline" onClick={() => handleRevoke(member.id)}>
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {isOwner && family.members.length < family.max_seats && (
              <form onSubmit={handleInvite} className="flex items-end gap-3">
                <div className="grid flex-1 gap-2">
                  <Label htmlFor="invite_email">Invite by email</Label>
                  <Input
                    id="invite_email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="name@example.com"
                  />
                  <InputError message={inviteErrors.email?.[0]} />
                </div>
                <Button type="submit" disabled={inviting}>
                  {inviting ? "Sending…" : "Send invite"}
                </Button>
              </form>
            )}
          </div>
        )}
      </div>
    </SettingsLayout>
  );
}
