"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Users, Edit, Shield } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  payoutBankCode: string | null;
  payoutAccountNumber: string | null;
  payoutAccountName: string | null;
  transactionFeePercent: number | null;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/admin/users");
        if (res.ok) {
          const data = await res.json();
          setUsers(data);
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const handleUpdateFee = async (userId: string) => {
    const fee = parseFloat(editValue);
    if (isNaN(fee) || fee < 0 || fee > 100) {
      toast({ title: "Error", description: "Invalid fee percentage", variant: "destructive" });
      return;
    }

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, transactionFeePercent: fee }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast({ title: "Error", description: data.error, variant: "destructive" });
        return;
      }

      setUsers(users.map(u => u.id === userId ? { ...u, transactionFeePercent: fee } : u));
      setEditingId(null);
      toast({ title: "Success", description: "Fee updated" });
    } catch {
      toast({ title: "Error", description: "Failed to update fee", variant: "destructive" });
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast({ title: "Error", description: data.error, variant: "destructive" });
        return;
      }

      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast({ title: "Success", description: `User role changed to ${newRole}` });
    } catch {
      toast({ title: "Error", description: "Failed to update role", variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              All Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3">Name</th>
                    <th className="text-left py-3">Email</th>
                    <th className="text-left py-3">Role</th>
                    <th className="text-left py-3">Bank</th>
                    <th className="text-left py-3">Fee %</th>
                    <th className="text-left py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b">
                      <td className="py-3">{user.name || "—"}</td>
                      <td className="py-3">{user.email}</td>
                      <td className="py-3">
                        <select
                          value={user.role}
                          onChange={(e) => handleChangeRole(user.id, e.target.value)}
                          className={`px-2 py-1 rounded text-xs border ${
                            user.role === "ORGANIZER" ? "bg-blue-50" : "bg-gray-50"
                          }`}
                        >
                          <option value="ATTENDEE">ATTENDEE</option>
                          <option value="ORGANIZER">ORGANIZER</option>
                        </select>
                      </td>
                      <td className="py-3">
                        {user.payoutAccountNumber ? (
                          <span className="text-muted-foreground">****{user.payoutAccountNumber.slice(-4)}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-3">
                        {editingId === user.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              step="0.1"
                              min="0"
                              max="100"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="w-20 h-8"
                            />
                            <Button size="sm" onClick={() => handleUpdateFee(user.id)}>Save</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                          </div>
                        ) : (
                          <span>{user.transactionFeePercent ?? 5}%</span>
                        )}
                      </td>
                      <td className="py-3">
                        {editingId !== user.id && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingId(user.id);
                              setEditValue((user.transactionFeePercent ?? 5).toString());
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}