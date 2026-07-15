"use client";

import { SquarePen, Trash } from "lucide-react";
import { useState } from "react";
import AdminGuard from "@/components/admin/AdminGuard";
import AppLayout from "@/components/app/AppLayout";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/ShadcnButton";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type MockUser = {
  name: string;
  email: string;
  profileImage: string;
  phoneNumber: string;
  status: "Active" | "Inactive";
};

const initialUsers: MockUser[] = [
  { name: "Ali", email: "ali@test.com", profileImage: "https://i.pravatar.cc/40?img=1", phoneNumber: "+123 456 7890", status: "Active" },
  { name: "Ahmed", email: "ahmed@test.com", profileImage: "https://i.pravatar.cc/40?img=2", phoneNumber: "+987 654 3210", status: "Inactive" },
  { name: "Sara", email: "sara@test.com", profileImage: "https://i.pravatar.cc/40?img=3", phoneNumber: "+111 222 3333", status: "Active" },
  { name: "Usman", email: "usman@test.com", profileImage: "https://i.pravatar.cc/40?img=4", phoneNumber: "+444 555 6666", status: "Inactive" },
  { name: "Ali", email: "ali@test.com", profileImage: "https://i.pravatar.cc/40?img=1", phoneNumber: "+123 456 7890", status: "Active" },
  { name: "Ahmed", email: "ahmed@test.com", profileImage: "https://i.pravatar.cc/40?img=2", phoneNumber: "+987 654 3210", status: "Inactive" },
  { name: "Sara", email: "sara@test.com", profileImage: "https://i.pravatar.cc/40?img=3", phoneNumber: "+111 222 3333", status: "Active" },
  { name: "Usman", email: "usman@test.com", profileImage: "https://i.pravatar.cc/40?img=4", phoneNumber: "+444 555 6666", status: "Inactive" },
  { name: "Ali", email: "ali@test.com", profileImage: "https://i.pravatar.cc/40?img=1", phoneNumber: "+123 456 7890", status: "Active" },
  { name: "Ahmed", email: "ahmed@test.com", profileImage: "https://i.pravatar.cc/40?img=2", phoneNumber: "+987 654 3210", status: "Inactive" },
  { name: "Sara", email: "sara@test.com", profileImage: "https://i.pravatar.cc/40?img=3", phoneNumber: "+111 222 3333", status: "Active" },
  { name: "Usman", email: "usman@test.com", profileImage: "https://i.pravatar.cc/40?img=4", phoneNumber: "+444 555 6666", status: "Inactive" },
];

export default function UserManagementPage() {
  const [users, setUsers] = useState<MockUser[]>(initialUsers);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<MockUser | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<MockUser | null>(null);

  function handleEdit(row: MockUser) {
    setSelectedUser({ ...row });
    setEditOpen(true);
  }

  function handleDelete(row: MockUser) {
    setUserToDelete(row);
    setDeleteOpen(true);
  }

  function confirmDelete() {
    setUsers((prev) => prev.filter((u) => u !== userToDelete));
    setDeleteOpen(false);
  }

  return (
    <AdminGuard>
      <AppLayout breadcrumbs={[{ title: "Dashboard", href: "/dashboard" }, { title: "User Management", href: "/admin/user-management" }]}>
        <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profile Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((row, i) => (
                <TableRow key={i}>
                  <TableCell>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={row.profileImage} alt="profile" className="h-10 w-10 rounded-full object-cover" />
                  </TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>{row.phoneNumber}</TableCell>
                  <TableCell>
                    <span
                      className={
                        row.status === "Active"
                          ? "rounded-full bg-green-600/15 px-2.5 py-1 text-green-600"
                          : "rounded-full bg-red-600/15 px-2.5 py-1 text-red-600"
                      }
                    >
                      {row.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <button className="rounded bg-blue-600 p-2 text-white hover:bg-blue-800" onClick={() => handleEdit(row)}>
                        <SquarePen className="h-4 w-4" />
                      </button>
                      <button className="rounded bg-red-600 p-2 text-white hover:bg-red-800" onClick={() => handleDelete(row)}>
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>Update user information below.</DialogDescription>
            </DialogHeader>

            {selectedUser && (
              <div className="space-y-3 py-2">
                <div>
                  <Label className="text-sm font-medium">Name</Label>
                  <Input
                    value={selectedUser.name}
                    onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <Input
                    type="email"
                    value={selectedUser.email}
                    onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <Input
                    value={selectedUser.phoneNumber}
                    onChange={(e) => setSelectedUser({ ...selectedUser, phoneNumber: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <select
                    className="w-full rounded border bg-white p-2 text-gray-900"
                    value={selectedUser.status}
                    onChange={(e) => setSelectedUser({ ...selectedUser, status: e.target.value as "Active" | "Inactive" })}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            )}

            <DialogFooter className="flex justify-end gap-2">
              <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
              <Button onClick={() => console.log("Save user:", selectedUser)}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <span className="font-medium">{userToDelete?.name}</span>?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={confirmDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </AppLayout>
    </AdminGuard>
  );
}
