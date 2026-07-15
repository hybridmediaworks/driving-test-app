"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import InputError from "@/components/ui/InputError";
import { Label } from "@/components/ui/Label";
import PasswordInput from "@/components/ui/PasswordInput";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import HeadingSmall from "./HeadingSmall";

export default function DeleteUser() {
  const router = useRouter();
  const { logout } = useAuth();
  const [password, setPassword] = useState("");
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [open, setOpen] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  async function submitDelete(e: FormEvent) {
    e.preventDefault();
    setProcessing(true);
    setError(undefined);

    try {
      await api.delete("/profile", { password });
      setOpen(false);
      await logout();
      router.push("/");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.errors?.password?.[0] ?? err.message);
      }
      passwordRef.current?.focus();
    } finally {
      setProcessing(false);
    }
  }

  function clearForm() {
    setPassword("");
    setError(undefined);
  }

  return (
    <div className="space-y-6">
      <HeadingSmall title="Delete account" description="Delete your account and all of its resources" />
      <div className="space-y-4 rounded-lg border border-red-100 bg-red-50 p-4">
        <div className="relative space-y-0.5 text-red-600">
          <p className="font-medium">Warning</p>
          <p className="text-sm">Please proceed with caution, this cannot be undone.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50" />}>
            Delete account
          </DialogTrigger>
          <DialogContent>
            <form className="space-y-6" onSubmit={submitDelete}>
              <DialogHeader className="space-y-3">
                <DialogTitle>Are you sure you want to delete your account?</DialogTitle>
                <DialogDescription>
                  Once your account is deleted, all of its resources and data will also be permanently deleted.
                  Please enter your password to confirm you would like to permanently delete your account.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-2">
                <Label htmlFor="password" className="sr-only">
                  Password
                </Label>
                <PasswordInput
                  id="password"
                  ref={passwordRef}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <InputError message={error} />
              </div>

              <DialogFooter className="gap-2">
                <DialogClose render={<Button type="button" variant="secondary" onClick={clearForm} />}>
                  Cancel
                </DialogClose>

                <Button type="submit" variant="outline" className="border-red-600 text-red-600 hover:bg-red-50" disabled={processing}>
                  Delete account
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
