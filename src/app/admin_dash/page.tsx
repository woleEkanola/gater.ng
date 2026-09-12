"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { formatDate, formatCurrency } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/logout-button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  Calendar, 
  DollarSign, 
  Activity,
  Search,
  Filter,
  Download,
  Star,
  Trash2,
  Pencil,
  MoreVertical,
  Eye,
  EyeOff,
  Loader2,
  RotateCcw,
  Banknote,
  CopyCheck,
  Bell,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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

interface Stats {
  totalUsers: number;
  totalOrganizers: number;
  totalEvents: number;
  publishedEvents: number;
  totalRevenue: number;
}

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  payoutBankCode?: string | null;
  payoutAccountNumber?: string | null;
  payoutAccountName?: string | null;
  paystackSubaccountCode?: string | null;
}

interface Event {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  isFeatured: boolean;
  dateTime: string;
  organizer: { name: string | null };
}

interface Transaction {
  id: string;
  amount: number;
  createdAt: string;
  event: { title: string };
  buyer: { name: string | null; email: string };
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "events" | "financials" | "reports" | "settlements">("overview");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  const [attendeesOpen, setAttendeesOpen] = useState(false);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [selectedEventTitle, setSelectedEventTitle] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [selectedTicketIds, setSelectedTicketIds] = useState<Set<string>>(new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingAttendees, setDeletingAttendees] = useState(false);
  const [resetSalesOpen, setResetSalesOpen] = useState(false);
  const [resettingSales, setResettingSales] = useState(false);
  const [resetEventId, setResetEventId] = useState("");
  const [cleanupOpen, setCleanupOpen] = useState(false);
  const [cleanupEventId, setCleanupEventId] = useState("");
  const [cleanupEventTitle, setCleanupEventTitle] = useState("");
  const [cleanupTicketTypes, setCleanupTicketTypes] = useState<any[]>([]);
  const [cleanupTicketTypeId, setCleanupTicketTypeId] = useState("");
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupScanning, setCleanupScanning] = useState(false);
  const [cleanupPreview, setCleanupPreview] = useState<any>(null);
  const [cleanupConfirmOpen, setCleanupConfirmOpen] = useState(false);
  const [cleanupExecuting, setCleanupExecuting] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [reminderEventId, setReminderEventId] = useState("");
  const [reminderEventTitle, setReminderEventTitle] = useState("");
  const [reminderLoading, setReminderLoading] = useState(false);
  const [reminderPreview, setReminderPreview] = useState<any>(null);
  const [reminderConfirmOpen, setReminderConfirmOpen] = useState(false);
  const [reminderExecuting, setReminderExecuting] = useState(false);
  const [reminderBatchSize, setReminderBatchSize] = useState("50");
  const [reminderProgress, setReminderProgress] = useState<{ sent: number; failed: number; total: number } | null>(null);
  const [reminderFailures, setReminderFailures] = useState<{ email: string; error: string }[]>([]);
  const reminderStopRef = useRef(false);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [settlementSearch, setSettlementSearch] = useState("");
  const [settlementPage, setSettlementPage] = useState(1);
  const [settlementTotal, setSettlementTotal] = useState(0);
  const [settlementTotalPages, setSettlementTotalPages] = useState(1);
  const [loadingSettlements, setLoadingSettlements] = useState(false);
  const [syncingAll, setSyncingAll] = useState(false);

  const handleSyncAll = async () => {
    setSyncingAll(true);
    try {
      const res = await fetch("/api/admin/settlements/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Sync complete", description: `${data.newRecords} new payout record(s) from ${data.totalTransfersChecked} transfers` });
        fetchSettlements();
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Sync failed", variant: "destructive" });
    } finally {
      setSyncingAll(false);
    }
  };

  useEffect(() => {
    fetchStats();
    if (activeTab === "users") fetchUsers();
    if (activeTab === "events") fetchEvents();
    if (activeTab === "financials") fetchTransactions();
    if (activeTab === "settlements") fetchSettlements();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "users") fetchUsers();
    if (activeTab === "events") fetchEvents();
    if (activeTab === "settlements") fetchSettlements();
  }, [search, roleFilter, eventFilter, settlementSearch, settlementPage]);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {}
    setLoading(false);
  };

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch {}
  };

  const fetchEvents = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (eventFilter) params.set("status", eventFilter);
      const res = await fetch(`/api/admin/events?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch {}
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch("/api/admin/transactions");
      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch {}
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      fetchUsers();
    } catch {}
  };

  const handleFeatureEvent = async (eventId: string, featured: boolean) => {
    try {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured }),
      });
      if (res.ok) {
        toast({ title: featured ? "Event featured" : "Event unfeatured" });
        fetchEvents();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error || "Failed to update feature status", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    try {
      await fetch(`/api/admin/events/${eventId}`, { method: "DELETE" });
      fetchEvents();
    } catch {}
  };

  const openAttendees = async (eventId: string, eventTitle: string) => {
    setSelectedEventId(eventId);
    setSelectedEventTitle(eventTitle);
    setSelectedTicketIds(new Set());
    setAttendeesOpen(true);
    setLoadingAttendees(true);
    try {
      const res = await fetch(`/api/attendees?eventId=${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setAttendees(data.tickets || data);
      }
    } catch {
      setAttendees([]);
    } finally {
      setLoadingAttendees(false);
    }
  };

  const toggleTicketSelection = (ticketId: string) => {
    setSelectedTicketIds((prev) => {
      const next = new Set(prev);
      if (next.has(ticketId)) next.delete(ticketId);
      else next.add(ticketId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedTicketIds.size === attendees.length) {
      setSelectedTicketIds(new Set());
    } else {
      setSelectedTicketIds(new Set(attendees.map((t) => t.id)));
    }
  };

  const handleBulkDelete = async () => {
    setDeletingAttendees(true);
    try {
      const ticketIds = Array.from(selectedTicketIds);
      const res = await fetch("/api/tickets/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: selectedEventId,
          ticketIds: ticketIds.length === attendees.length ? undefined : ticketIds,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Success", description: data.message });
        setDeleteConfirmOpen(false);
        setAttendeesOpen(false);
        setSelectedTicketIds(new Set());
      } else {
        toast({ title: "Error", description: data.error || "Failed to delete", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete tickets", variant: "destructive" });
    } finally {
      setDeletingAttendees(false);
    }
  };

  const handleTogglePublish = async (eventId: string, published: boolean) => {
    try {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ published }),
      });
      if (res.ok) {
        toast({ title: published ? "Event published" : "Event unpublished" });
        fetchEvents();
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error || "Failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    }
  };

  const handleResetSales = async () => {
    if (!resetEventId) return;
    setResettingSales(true);
    try {
      const res = await fetch(`/api/admin/events/${resetEventId}/reset-sales`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        toast({ 
          title: "Sales reset", 
          description: `Deleted ${data.deleted.orders} orders, ${data.deleted.tickets} tickets, ${data.deleted.checkIns} check-ins. Reset ${data.reset.ticketTypes} ticket types.`,
        });
        setResetSalesOpen(false);
        fetchEvents();
      } else {
        toast({ title: "Error", description: data.error || "Failed to reset sales", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to reset sales", variant: "destructive" });
    } finally {
      setResettingSales(false);
    }
  };

  const exportCSV = () => {
    const rows = [["Date", "Event", "Amount", "Buyer"]];
    transactions.forEach(t => {
      rows.push([formatDate(t.createdAt), t.event.title, t.amount.toString(), t.buyer.email]);
    });
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${Date.now()}.csv`;
    a.click();
  };

  const openCleanup = async (eventId: string, eventTitle: string) => {
    setCleanupEventId(eventId);
    setCleanupEventTitle(eventTitle);
    setCleanupTicketTypeId("");
    setCleanupPreview(null);
    setCleanupTicketTypes([]);
    setCleanupOpen(true);
    setCleanupLoading(true);
    try {
      const res = await fetch(`/api/ticket-types?eventId=${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setCleanupTicketTypes(data);
      } else {
        toast({ title: "Error", description: "Failed to load ticket types", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to load ticket types", variant: "destructive" });
    } finally {
      setCleanupLoading(false);
    }
  };

  const handleCleanupScan = async () => {
    if (!cleanupTicketTypeId) {
      toast({ title: "Select a ticket type", variant: "destructive" });
      return;
    }
    setCleanupScanning(true);
    setCleanupPreview(null);
    try {
      const res = await fetch("/api/admin/tickets/cleanup-duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: cleanupEventId, ticketTypeId: cleanupTicketTypeId, dryRun: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setCleanupPreview(data);
      } else {
        toast({ title: "Error", description: data.error || "Failed to scan", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setCleanupScanning(false);
    }
  };

  const handleCleanupExecute = async () => {
    if (!cleanupTicketTypeId) return;
    setCleanupExecuting(true);
    try {
      const res = await fetch("/api/admin/tickets/cleanup-duplicates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: cleanupEventId, ticketTypeId: cleanupTicketTypeId, dryRun: false }),
      });
      const data = await res.json();
      if (res.ok) {
        toast({
          title: "Duplicates cleaned up",
          description: `Deleted ${data.deletedTickets} duplicate ticket(s). Sold count corrected from ${data.soldCountBefore} to ${data.soldCountAfter}.`,
        });
        setCleanupConfirmOpen(false);
        setCleanupOpen(false);
        setCleanupPreview(null);
        fetchEvents();
      } else {
        toast({ title: "Error", description: data.error || "Failed to clean up", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setCleanupExecuting(false);
    }
  };

  const openReminder = async (eventId: string, eventTitle: string) => {
    setReminderEventId(eventId);
    setReminderEventTitle(eventTitle);
    setReminderPreview(null);
    setReminderProgress(null);
    setReminderFailures([]);
    setReminderBatchSize("50");
    reminderStopRef.current = false;
    setReminderOpen(true);
    setReminderLoading(true);
    try {
      const res = await fetch(`/api/admin/events/${eventId}/send-reminder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setReminderPreview(data);
      } else {
        toast({ title: "Error", description: data.error || "Failed to load recipients", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setReminderLoading(false);
    }
  };

  const handleReminderExecute = async () => {
    if (!reminderEventId || !reminderPreview) return;
    const total = reminderPreview.totalRecipients as number;
    const size = reminderBatchSize === "all" ? total : parseInt(reminderBatchSize, 10);
    reminderStopRef.current = false;
    setReminderExecuting(true);
    setReminderProgress({ sent: 0, failed: 0, total });
    setReminderFailures([]);
    let sent = 0;
    let failed = 0;
    const failures: { email: string; error: string }[] = [];
    let stopped = false;
    try {
      for (let offset = 0; offset < total; offset += size) {
        if (reminderStopRef.current) {
          stopped = true;
          break;
        }
        const res = await fetch(`/api/admin/events/${reminderEventId}/send-reminder`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dryRun: false, offset, limit: size }),
        });
        const data = await res.json();
        if (!res.ok) {
          toast({ title: "Error", description: data.error || `Batch starting at ${offset + 1} failed`, variant: "destructive" });
          break;
        }
        sent += data.sent;
        failed += data.failed;
        failures.push(...(data.failures || []));
        setReminderProgress({ sent, failed, total });
        setReminderFailures([...failures]);
        if (offset + size < total) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }
      toast({
        title: stopped ? "Reminder send stopped" : "Reminders sent",
        description: `Sent ${sent} of ${total} reminder email(s).${failed > 0 ? ` ${failed} failed.` : ""}${reminderPreview.skippedNoEmail > 0 ? ` ${reminderPreview.skippedNoEmail} order(s) skipped (no email).` : ""}`,
      });
      if (!stopped) {
        setReminderConfirmOpen(false);
        setReminderOpen(false);
        setReminderPreview(null);
        setReminderProgress(null);
      }
    } catch {
      toast({ title: "Error", description: "Network error", variant: "destructive" });
    } finally {
      setReminderExecuting(false);
    }
  };

  const fetchSettlements = async () => {
    setLoadingSettlements(true);
    try {
      const params = new URLSearchParams();
      if (settlementSearch) params.set("search", settlementSearch);
      params.set("page", settlementPage.toString());
      params.set("limit", "20");
      const res = await fetch(`/api/admin/settlements?${params}`);
      if (res.ok) {
        const data = await res.json();
        setSettlements(data.organizers);
        setSettlementTotal(data.total);
        setSettlementTotalPages(data.totalPages);
      }
    } catch {}
    setLoadingSettlements(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-rose-600">
            Hitix Admin
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium hover:text-rose-600">
              Organizer Dashboard
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex gap-4 border-b mb-8 overflow-x-auto">
          {[
            { id: "overview", label: "Overview", icon: Activity },
            { id: "users", label: "Users", icon: Users },
            { id: "events", label: "Events", icon: Calendar },
            { id: "financials", label: "Financials", icon: DollarSign },
            { id: "settlements", label: "Settlements", icon: Banknote },
            { id: "reports", label: "Reports", icon: Download },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 pb-3 px-1 font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id 
                  ? "text-rose-600 border-b-2 border-rose-600" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.totalUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">{stats?.totalOrganizers || 0} organizers</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.totalEvents || 0}</div>
                  <p className="text-xs text-muted-foreground">{stats?.publishedEvents || 0} published</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Platform Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatCurrency(stats?.totalRevenue || 0)}</div>
                  <p className="text-xs text-muted-foreground">Total fees collected</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats?.totalUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">New users</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{user.name || user.email}</p>
                        <p className="text-sm text-muted-foreground">{user.role}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</p>
                    </div>
                  ))}
                  {users.length === 0 && (
                    <p className="text-muted-foreground">No recent activity</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "users" && (
          <div className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="">All Roles</option>
                <option value="ATTENDEE">Attendee</option>
                <option value="ORGANIZER">Organizer</option>
              </select>
            </div>

            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="p-4 font-medium">Name</th>
                      <th className="p-4 font-medium">Email</th>
                      <th className="p-4 font-medium">Role</th>
                      <th className="p-4 font-medium">Payout</th>
                      <th className="p-4 font-medium">Joined</th>
                      <th className="p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b">
                        <td className="p-4">{user.name || "-"}</td>
                        <td className="p-4">{user.email}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-gray-100 rounded text-sm">{user.role}</span>
                        </td>
                        <td className="p-4">
                          {user.payoutBankCode && user.payoutAccountNumber && user.payoutAccountName ? (
                            <span className="text-green-600 text-sm font-medium">✅ Setup</span>
                          ) : (
                            <span className="text-red-400 text-sm">✗ Not set</span>
                          )}
                        </td>
                        <td className="p-4 text-muted-foreground">{formatDate(user.createdAt)}</td>
                        <td className="p-4">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            className="text-sm border rounded px-2 py-1"
                          >
                            <option value="ATTENDEE">Attendee</option>
                            <option value="ORGANIZER">Organizer</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <p className="p-4 text-center text-muted-foreground">No users found</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "events" && (
          <div className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search events..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="p-4 font-medium">Title</th>
                      <th className="p-4 font-medium">Organizer</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium">Date</th>
                      <th className="p-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => (
                      <tr key={event.id} className="border-b">
                        <td className="p-4">
                          <Link href={`/events/${event.slug}`} className="hover:text-rose-600">
                            {event.title}
                          </Link>
                        </td>
                        <td className="p-4">{event.organizer.name || "-"}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-sm ${event.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100"}`}>
                            {event.isPublished ? "Published" : "Draft"}
                          </span>
                        </td>
                        <td className="p-4 text-muted-foreground">{formatDate(event.dateTime)}</td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Link
                              href={`/dashboard/events/${event.id}`}
                              className="p-2 rounded hover:bg-blue-100 text-blue-600"
                              title="Edit Event"
                            >
                              <Pencil className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleFeatureEvent(event.id, !event.isFeatured)}
                              className={`p-2 rounded hover:bg-gray-100 ${event.isFeatured ? "text-rose-600" : "text-gray-400"}`}
                              title={event.isFeatured ? "Unfeature" : "Feature"}
                            >
                              <Star className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openAttendees(event.id, event.title)}
                              className="p-2 rounded hover:bg-gray-100 text-blue-600"
                              title="View Attendees"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleTogglePublish(event.id, !event.isPublished)}
                              className={`p-2 rounded hover:bg-gray-100 ${event.isPublished ? "text-amber-600" : "text-green-600"}`}
                              title={event.isPublished ? "Unpublish" : "Publish"}
                            >
                              <EyeOff className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setResetEventId(event.id); setResetSalesOpen(true); }}
                              className="p-2 rounded hover:bg-gray-100 text-orange-600"
                              title="Reset Sales"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openCleanup(event.id, event.title)}
                              className="p-2 rounded hover:bg-gray-100 text-purple-600"
                              title="Cleanup Duplicate Tickets"
                            >
                              <CopyCheck className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openReminder(event.id, event.title)}
                              className="p-2 rounded hover:bg-gray-100 text-sky-600"
                              title="Send Reminder"
                            >
                              <Bell className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
                              className="p-2 rounded hover:bg-red-100 text-red-600"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {events.length === 0 && (
                  <p className="p-4 text-center text-muted-foreground">No events found</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "financials" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Transactions</h2>
              <Button onClick={exportCSV} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left">
                      <th className="p-4 font-medium">Date</th>
                      <th className="p-4 font-medium">Event</th>
                      <th className="p-4 font-medium">Buyer</th>
                      <th className="p-4 font-medium">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id} className="border-b">
                        <td className="p-4 text-muted-foreground">{formatDate(t.createdAt)}</td>
                        <td className="p-4">{t.event.title}</td>
                        <td className="p-4">{t.buyer.email}</td>
                        <td className="p-4 font-medium">{formatCurrency(t.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {transactions.length === 0 && (
                  <p className="p-4 text-center text-muted-foreground">No transactions</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "reports" && (
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Organizers by Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.slice(0, 5).map((user, i) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-rose-100 rounded-full flex items-center justify-center text-sm font-medium">
                          {i + 1}
                        </span>
                        <span>{user.name || user.email}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Popular Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {events.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex items-center justify-between">
                      <Link href={`/events/${event.slug}`} className="hover:text-rose-600">
                        {event.title}
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "settlements" && (
          <div className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by organizer name or email..."
                  value={settlementSearch}
                  onChange={(e) => { setSettlementSearch(e.target.value); setSettlementPage(1); }}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" size="sm" onClick={handleSyncAll} disabled={syncingAll}>
                <RotateCcw className={`w-4 h-4 mr-1 ${syncingAll ? "animate-spin" : ""}`} />
                {syncingAll ? "Syncing..." : "Sync All Payouts"}
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                {loadingSettlements ? (
                  <div className="py-8 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                  </div>
                ) : settlements.length === 0 ? (
                  <p className="p-8 text-center text-muted-foreground">No organizers with revenue found.</p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b">
                          <tr className="text-left">
                            <th className="p-4 font-medium">Organizer</th>
                            <th className="p-4 font-medium">Revenue</th>
                            <th className="p-4 font-medium">Expected</th>
                            <th className="p-4 font-medium">Settled</th>
                            <th className="p-4 font-medium">Pending</th>
                          </tr>
                        </thead>
                        <tbody>
                          {settlements.map((s: any) => (
                            <tr key={s.id} className="border-b">
                              <td className="p-4">
                                <p className="font-medium">{s.name}</p>
                                <p className="text-sm text-muted-foreground">{s.email}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {s.hasBankSetup ? (
                                    <span className="text-green-600">Bank setup</span>
                                  ) : (
                                    <span className="text-red-400">No bank</span>
                                  )}
                                  {" · "}{s.orderCount} orders
                                </p>
                              </td>
                              <td className="p-4">₦{s.totalRevenue.toLocaleString()}</td>
                              <td className="p-4">₦{s.expectedSettlement.toLocaleString()}</td>
                              <td className="p-4 text-green-600">₦{s.actualSettled.toLocaleString()}</td>
                              <td className={`p-4 ${s.pending > 0 ? "text-amber-600" : "text-muted-foreground"}`}>
                                ₦{s.pending.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {settlementTotalPages > 1 && (
                      <div className="flex items-center justify-between p-4 border-t">
                        <p className="text-sm text-muted-foreground">
                          Page {settlementPage} of {settlementTotalPages} ({settlementTotal} total)
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSettlementPage((p) => Math.max(1, p - 1))}
                            disabled={settlementPage <= 1}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSettlementPage((p) => p + 1)}
                            disabled={settlementPage >= settlementTotalPages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      <Dialog open={attendeesOpen} onOpenChange={setAttendeesOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Attendees — {selectedEventTitle}</DialogTitle>
            <DialogDescription>
              Select tickets to delete. Deleted tickets will no longer be valid for check-in.
            </DialogDescription>
          </DialogHeader>
          {loadingAttendees ? (
            <div className="py-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
            </div>
          ) : attendees.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No attendees found.</p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedTicketIds.size === attendees.length && attendees.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  Select All ({attendees.length})
                </label>
                {selectedTicketIds.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteConfirmOpen(true)}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Delete Selected ({selectedTicketIds.size})
                  </Button>
                )}
              </div>
              <div className="max-h-[50vh] overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted border-b">
                    <tr>
                      <th className="p-3 w-10"></th>
                      <th className="p-3 text-left font-medium">Ticket ID</th>
                      <th className="p-3 text-left font-medium">Type</th>
                      <th className="p-3 text-left font-medium">Buyer</th>
                      <th className="p-3 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendees.map((ticket: any) => (
                      <tr key={ticket.id} className="border-b hover:bg-muted/50">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedTicketIds.has(ticket.id)}
                            onChange={() => toggleTicketSelection(ticket.id)}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                        </td>
                        <td className="p-3 font-mono">{ticket.ticketId}</td>
                        <td className="p-3">{ticket.ticketType?.name}</td>
                        <td className="p-3">{ticket.owner?.name || ticket.owner?.email || "N/A"}</td>
                        <td className="p-3">
                          {ticket.isUsed ? (
                            <span className="text-green-600">Used</span>
                          ) : ticket.checkedInCount > 0 ? (
                            <span className="text-yellow-600">Partial</span>
                          ) : (
                            <span className="text-muted-foreground">Not Used</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attendees</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedTicketIds.size === attendees.length ? "ALL" : selectedTicketIds.size} ticket(s)?
              This action cannot be undone. The tickets will no longer be valid for check-in.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingAttendees}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} disabled={deletingAttendees}>
              {deletingAttendees ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={resetSalesOpen} onOpenChange={setResetSalesOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Sales Records</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all orders, tickets, and check-ins for this event.
              Ticket types will be preserved but sold counts will reset to zero.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={resettingSales}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetSales} disabled={resettingSales} className="bg-orange-600 hover:bg-orange-700">
              {resettingSales ? "Resetting..." : "Reset Sales"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={cleanupOpen} onOpenChange={setCleanupOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cleanup Duplicate Tickets</DialogTitle>
            <DialogDescription>
              {cleanupEventTitle} — find and remove duplicate tickets caused by double-processing.
            </DialogDescription>
          </DialogHeader>

          {cleanupLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : !cleanupPreview ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Ticket Type</label>
                <select
                  value={cleanupTicketTypeId}
                  onChange={(e) => setCleanupTicketTypeId(e.target.value)}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  <option value="">Select a ticket type...</option>
                  {cleanupTicketTypes.map((tt: any) => (
                    <option key={tt.id} value={tt.id}>
                      {tt.name} — {formatCurrency(tt.price)}
                    </option>
                  ))}
                </select>
              </div>
              <Button onClick={handleCleanupScan} disabled={cleanupScanning || !cleanupTicketTypeId}>
                {cleanupScanning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scanning...
                  </>
                ) : (
                  "Scan for Duplicates"
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border p-3">
                <p className="text-sm font-medium">
                  {cleanupPreview.totalAffectedOrders > 0
                    ? `Found ${cleanupPreview.totalDuplicates} duplicate ticket(s) across ${cleanupPreview.totalAffectedOrders} order(s).`
                    : "No duplicates found."}
                </p>
                {cleanupPreview.totalSkippedOrders > 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    {cleanupPreview.totalSkippedOrders} order(s) skipped (needs manual review).
                  </p>
                )}
              </div>

              {cleanupPreview.affectedOrders.length > 0 && (
                <div className="max-h-64 overflow-y-auto border rounded-md">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-gray-50">
                      <tr className="text-left">
                        <th className="p-2 font-medium">Order</th>
                        <th className="p-2 font-medium">Buyer</th>
                        <th className="p-2 font-medium">Found</th>
                        <th className="p-2 font-medium">To Delete</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cleanupPreview.affectedOrders.map((o: any) => (
                        <tr key={o.orderId} className="border-b">
                          <td className="p-2 font-mono text-xs">{o.orderId}</td>
                          <td className="p-2">{o.buyerEmail || o.buyerName || "N/A"}</td>
                          <td className="p-2">{o.ticketsFound}</td>
                          <td className="p-2 text-rose-600 font-medium">{o.duplicatesToDelete}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {cleanupPreview.ambiguousOrders.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Skipped orders:</p>
                  {cleanupPreview.ambiguousOrders.map((o: any) => (
                    <p key={o.orderId} className="text-xs text-muted-foreground">
                      <span className="font-mono">{o.orderId}</span> — {o.reason}
                    </p>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCleanupPreview(null)}>
                  Back
                </Button>
                {cleanupPreview.totalAffectedOrders > 0 && (
                  <Button
                    variant="destructive"
                    onClick={() => setCleanupConfirmOpen(true)}
                  >
                    Clean Up {cleanupPreview.totalDuplicates} Duplicate(s)
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={reminderOpen} onOpenChange={setReminderOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Send Event Reminder</DialogTitle>
            <DialogDescription>
              {reminderEventTitle} — email all ticket buyers
              {reminderPreview?.timing === "today"
                ? " that the event is today."
                : reminderPreview?.timing === "soon"
                  ? " that the event is coming up soon."
                  : " that the event is tomorrow."}
            </DialogDescription>
          </DialogHeader>

          {reminderLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : !reminderPreview ? (
            <p className="text-muted-foreground text-center py-8">No recipient data.</p>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border p-3">
                <p className="text-sm font-medium">
                  {reminderPreview.totalRecipients > 0
                    ? `This will email ${reminderPreview.totalRecipients} buyer(s) holding ${reminderPreview.totalTickets} ticket(s).`
                    : "No buyers with email addresses found for this event."}
                </p>
                {reminderPreview.skippedNoEmail > 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    {reminderPreview.skippedNoEmail} order(s) skipped (no email on file).
                  </p>
                )}
              </div>

              {reminderPreview.recipients?.length > 0 && (
                <div className="max-h-64 overflow-y-auto border rounded-md">
                  <table className="w-full text-sm">
                    <thead className="border-b bg-gray-50">
                      <tr className="text-left">
                        <th className="p-2 font-medium">Buyer</th>
                        <th className="p-2 font-medium">Email</th>
                        <th className="p-2 font-medium">Tickets</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reminderPreview.recipients.slice(0, 100).map((r: any) => (
                        <tr key={r.email} className="border-b">
                          <td className="p-2">{r.name}</td>
                          <td className="p-2">{r.email}</td>
                          <td className="p-2">{r.ticketCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {reminderPreview.recipients.length > 100 && (
                    <p className="p-2 text-xs text-muted-foreground">
                      Showing first 100 of {reminderPreview.recipients.length} recipients.
                    </p>
                  )}
                </div>
              )}

              {reminderPreview.totalRecipients > 0 && (
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium">Batch size</label>
                  <select
                    value={reminderBatchSize}
                    onChange={(e) => setReminderBatchSize(e.target.value)}
                    disabled={reminderExecuting}
                    className="p-2 border rounded-md text-sm"
                  >
                    <option value="25">25 per batch</option>
                    <option value="50">50 per batch</option>
                    <option value="100">100 per batch</option>
                    <option value="all">All at once</option>
                  </select>
                  <p className="text-xs text-muted-foreground">
                    {reminderBatchSize === "all"
                      ? "Single send"
                      : `${Math.ceil(reminderPreview.totalRecipients / parseInt(reminderBatchSize, 10))} batch(es)`}
                  </p>
                </div>
              )}

              {reminderProgress && (
                <div className="space-y-2">
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-sky-600 transition-all"
                      style={{ width: `${reminderProgress.total > 0 ? Math.round(((reminderProgress.sent + reminderProgress.failed) / reminderProgress.total) * 100) : 0}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Sent {reminderProgress.sent} of {reminderProgress.total}
                    {reminderProgress.failed > 0 && ` (${reminderProgress.failed} failed)`}…
                  </p>
                  {reminderFailures.length > 0 && (
                    <p className="text-xs text-rose-600">
                      Failed: {reminderFailures.slice(0, 5).map((f) => f.email).join(", ")}
                      {reminderFailures.length > 5 && ` and ${reminderFailures.length - 5} more`}
                    </p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2">
                {reminderExecuting ? (
                  <Button variant="outline" onClick={() => { reminderStopRef.current = true; }}>
                    Stop after current batch
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setReminderOpen(false)}>
                      Cancel
                    </Button>
                    {reminderPreview.totalRecipients > 0 && (
                      <Button
                        onClick={() => setReminderConfirmOpen(true)}
                      >
                        <Bell className="w-4 h-4 mr-2" />
                        Send to {reminderPreview.totalRecipients} Buyer(s)
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={reminderConfirmOpen} onOpenChange={setReminderConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Reminder</AlertDialogTitle>
            <AlertDialogDescription>
              This will send the reminder email to {reminderPreview?.totalRecipients ?? 0} buyer(s)
              {reminderBatchSize !== "all" && reminderPreview
                ? ` in ${Math.ceil(reminderPreview.totalRecipients / parseInt(reminderBatchSize, 10))} batch(es) of ${reminderBatchSize}`
                : " all at once"}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reminderExecuting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReminderExecute} disabled={reminderExecuting} className="bg-sky-600 hover:bg-sky-700">
              {reminderExecuting ? "Sending..." : "Confirm Send"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={cleanupConfirmOpen} onOpenChange={setCleanupConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Cleanup</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {cleanupPreview?.totalDuplicates ?? 0} duplicate ticket(s).
              The oldest tickets for each order are kept; duplicates are removed and sold counts corrected.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cleanupExecuting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleCleanupExecute} disabled={cleanupExecuting} className="bg-purple-600 hover:bg-purple-700">
              {cleanupExecuting ? "Cleaning up..." : "Confirm Cleanup"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}