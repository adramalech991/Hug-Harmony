// src/app/admin/dashboard/moderators/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, ShieldAlert, History, BarChart3, Search, Clock, User, AlertTriangle, ShieldCheck, RefreshCw, Users, ArrowUpRight, Loader2, LayoutDashboard, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

const moderatorFormSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters").max(20),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

const updateFormSchema = z.object({
    username: z.string().min(3).max(20).optional().or(z.literal("")),
    email: z.string().email().optional().or(z.literal("")),
    password: z.string().min(6).optional().or(z.literal("")),
});

interface Moderator {
    id: string;
    username: string;
    email: string;
    createdAt: string;
    lastLoginAt: string | null;
    status: string;
}

interface ModerationAction {
    id: string;
    actionType: string;
    reason: string;
    targetUserId: string;
    conversationId: string | null;
    createdAt: string;
    moderator: {
        firstName: string | null;
        lastName: string | null;
        email: string;
    };
    targetUser: {
        firstName: string | null;
        lastName: string | null;
        email: string;
    } | null;
}

interface ModerationStats {
    totalActions: number;
    actionsByType: Record<string, number>;
    recentActions: number;
    topModerators: Array<{ name: string; count: number }>;
}

export default function ModeratorsPage() {
    const [moderators, setModerators] = useState<Moderator[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedModerator, setSelectedModerator] = useState<Moderator | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Activity & Stats state
    const [auditLogs, setAuditLogs] = useState<ModerationAction[]>([]);
    const [stats, setStats] = useState<ModerationStats | null>(null);
    const [activeTab, setActiveTab] = useState("accounts");
    const [auditLoading, setAuditLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(false);

    const form = useForm<z.infer<typeof moderatorFormSchema>>({
        resolver: zodResolver(moderatorFormSchema),
        defaultValues: {
            username: "",
            email: "",
            password: "",
        },
    });

    const updateForm = useForm<z.infer<typeof updateFormSchema>>({
        resolver: zodResolver(updateFormSchema),
        defaultValues: {
            username: "",
            email: "",
            password: "",
        },
    });

    const fetchModerators = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/admin/moderators");
            const data = await response.json();
            if (data.moderators) {
                setModerators(data.moderators);
            }
        } catch {
            toast.error("Failed to fetch moderators");
        } finally {
            setLoading(false);
        }
    };

    const fetchAuditLogs = async () => {
        try {
            setAuditLoading(true);
            const response = await fetch("/api/admin/moderation/audit?limit=20");
            const data = await response.json();
            if (data.actions) {
                setAuditLogs(data.actions);
            }
        } catch {
            toast.error("Failed to fetch audit logs");
        } finally {
            setAuditLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            setStatsLoading(true);
            const response = await fetch("/api/moderator/stats");
            const data = await response.json();
            if (data) {
                setStats(data);
            }
        } catch {
            toast.error("Failed to fetch moderation stats");
        } finally {
            setStatsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === "accounts") fetchModerators();
        if (activeTab === "activity") fetchAuditLogs();
        if (activeTab === "stats") fetchStats();
    }, [activeTab]);

    const onAddSubmit = async (values: z.infer<typeof moderatorFormSchema>) => {
        try {
            setSubmitting(true);
            const response = await fetch("/api/admin/moderators", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success("Moderator created successfully");
                setIsAddOpen(false);
                form.reset();
                fetchModerators();
            } else {
                toast.error(data.error || "Failed to create moderator");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    const onEditSubmit = async (values: z.infer<typeof updateFormSchema>) => {
        if (!selectedModerator) return;

        try {
            setSubmitting(true);
            // Only send fields that have values
            const body: Partial<z.infer<typeof updateFormSchema>> = {};
            if (values.username) body.username = values.username;
            if (values.email) body.email = values.email;
            if (values.password) body.password = values.password;

            const response = await fetch(`/api/admin/moderators/${selectedModerator.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success("Moderator updated successfully");
                setIsEditOpen(false);
                updateForm.reset();
                fetchModerators();
            } else {
                toast.error(data.error || "Failed to update moderator");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    const onDeleteConfirm = async () => {
        if (!selectedModerator) return;

        try {
            setSubmitting(true);
            const response = await fetch(`/api/admin/moderators/${selectedModerator.id}`, {
                method: "DELETE",
            });

            if (response.ok) {
                toast.success("Moderator deleted successfully");
                setIsDeleteOpen(false);
                fetchModerators();
            } else {
                const data = await response.json();
                toast.error(data.error || "Failed to delete moderator");
            }
        } catch {
            toast.error("An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    const openEdit = (moderator: Moderator) => {
        setSelectedModerator(moderator);
        updateForm.reset({
            username: moderator.username,
            email: moderator.email,
            password: "",
        });
        setIsEditOpen(true);
    };

    const openDelete = (moderator: Moderator) => {
        setSelectedModerator(moderator);
        setIsDeleteOpen(true);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
        >
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-[#C4C4C4] mb-2">
                <Link
                    href="/admin/dashboard"
                    className="hover:text-[#F3CFC6] flex items-center gap-1"
                >
                    <LayoutDashboard className="h-3 w-3" />
                    Dashboard
                </Link>
                <span>/</span>
                <span>Moderation Center</span>
            </div>

            <Card className="bg-gradient-to-r from-[#F3CFC6] to-[#C4C4C4] text-black dark:text-white shadow-lg">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="h-8 w-8" />
                            <div>
                                <CardTitle className="text-3xl font-bold">Moderation Center</CardTitle>
                                <p className="text-sm opacity-80">Monitor activity, manage moderator accounts, and view platform metrics</p>
                            </div>
                        </div>
                        <Link href="/admin/dashboard">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-black hover:bg-white/20"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Dashboard
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-[#F3CFC6]/20 dark:bg-[#C4C4C4]/20 border border-[#F3CFC6]/30">
                    <TabsTrigger value="accounts" className="data-[state=active]:bg-[#F3CFC6] data-[state=active]:text-black">
                        <Users className="h-4 w-4 mr-2" />
                        Moderator Accounts
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="data-[state=active]:bg-[#F3CFC6] data-[state=active]:text-black">
                        <History className="h-4 w-4 mr-2" />
                        Moderation Activity
                    </TabsTrigger>
                    <TabsTrigger value="stats" className="data-[state=active]:bg-[#F3CFC6] data-[state=active]:text-black">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Platform Stats
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="accounts" className="mt-6 space-y-6">
                    <div className="flex justify-end">
                        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-[#E8A8A2] hover:bg-[#D49791] text-black font-semibold">
                                    <Plus className="mr-2 h-4 w-4" /> Add Moderator
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-white dark:bg-[#1A1A1A] border-[#C4C4C4] dark:border-black">
                                <DialogHeader>
                                    <DialogTitle>Add New Moderator</DialogTitle>
                                    <DialogDescription>Create a new account for a platform moderator.</DialogDescription>
                                </DialogHeader>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onAddSubmit)} className="space-y-4 pt-4">
                                        <FormField
                                            control={form.control}
                                            name="username"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Username</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} placeholder="johndoe" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="email"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Email</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} type="email" placeholder="john@example.com" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="password"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Password</FormLabel>
                                                    <FormControl>
                                                        <Input {...field} type="password" placeholder="••••••••" />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <DialogFooter className="pt-4">
                                            <Button type="submit" disabled={submitting} className="bg-[#E8A8A2] hover:bg-[#D49791] text-black w-full">
                                                {submitting ? "Creating..." : "Create Moderator"}
                                            </Button>
                                        </DialogFooter>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <Card className="border-[#C4C4C4] dark:border-black bg-white dark:bg-[#1A1A1A]">
                        <CardHeader>
                            <CardTitle>Active Moderators</CardTitle>
                            <CardDescription>Accounts authorized to perform moderation tasks.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Username</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Created At</TableHead>
                                        <TableHead>Last Activity</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-10">
                                                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-[#F3CFC6]" />
                                                Loading moderators...
                                            </TableCell>
                                        </TableRow>
                                    ) : moderators.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-10 text-gray-500">No moderators found</TableCell>
                                        </TableRow>
                                    ) : (
                                        moderators.map((moderator) => (
                                            <TableRow key={moderator.id}>
                                                <TableCell className="font-medium">{moderator.username}</TableCell>
                                                <TableCell>{moderator.email}</TableCell>
                                                <TableCell>
                                                    <Badge variant={moderator.status === "active" ? "default" : "destructive"} className={moderator.status === "active" ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" : ""}>
                                                        {moderator.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{new Date(moderator.createdAt).toLocaleDateString()}</TableCell>
                                                <TableCell>{moderator.lastLoginAt ? new Date(moderator.lastLoginAt).toLocaleDateString() : "Never"}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="outline" size="icon" onClick={() => openEdit(moderator)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="outline" size="icon" className="text-red-500 hover:text-red-700" onClick={() => openDelete(moderator)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="activity" className="mt-6 space-y-4">
                    <Card className="border-[#C4C4C4] dark:border-black bg-white dark:bg-[#1A1A1A]">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Audit Log</CardTitle>
                                <CardDescription>Recent actions performed by moderators.</CardDescription>
                            </div>
                            <Button variant="outline" size="sm" onClick={fetchAuditLogs} disabled={auditLoading}>
                                <RefreshCw className={`h-4 w-4 mr-2 ${auditLoading ? "animate-spin" : ""}`} />
                                Refresh
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[600px] w-full pr-4">
                                <div className="space-y-4">
                                    {auditLoading && auditLogs.length === 0 ? (
                                        <div className="text-center py-10">
                                            <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#F3CFC6]" />
                                            <p className="mt-2 text-gray-500">Loading audit logs...</p>
                                        </div>
                                    ) : auditLogs.length === 0 ? (
                                        <div className="text-center py-10 text-gray-500 border-2 border-dashed rounded-lg">
                                            <ShieldCheck className="h-10 w-10 mx-auto mb-2 opacity-20" />
                                            No moderation activity recorded yet.
                                        </div>
                                    ) : (
                                        auditLogs.map((log) => (
                                            <div key={log.id} className="p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-4">
                                                        <div className={`mt-1 p-2 rounded-full ${log.actionType === "ban" ? "bg-red-100 text-red-600" :
                                                            log.actionType === "suspend" ? "bg-orange-100 text-orange-600" :
                                                                log.actionType === "warning" ? "bg-yellow-100 text-yellow-600" :
                                                                    "bg-blue-100 text-blue-600"
                                                            }`}>
                                                            {log.actionType === "warning" ? <AlertTriangle className="h-4 w-4" /> :
                                                                log.actionType === "restrict" ? <ShieldAlert className="h-4 w-4" /> :
                                                                    <ShieldCheck className="h-4 w-4" />}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold capitalize">
                                                                {log.actionType.replace("_", " ")}
                                                            </p>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                Moderator: <strong>{log.moderator.firstName} {log.moderator.lastName}</strong>
                                                            </p>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                Target User: <strong>{log.targetUser ? `${log.targetUser.firstName} ${log.targetUser.lastName}` : "System/Unknown"}</strong>
                                                            </p>
                                                            <div className="mt-2 text-sm bg-gray-50 dark:bg-black/20 p-2 rounded border-l-2 border-[#F3CFC6]">
                                                                <span className="text-xs uppercase font-bold text-gray-400 block mb-1">Reason:</span>
                                                                {log.reason}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-end gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {new Date(log.createdAt).toLocaleString()}
                                                        </p>
                                                        {log.conversationId && (
                                                            <Button variant="link" size="sm" className="h-auto p-0 mt-2 text-[#F3CFC6]" asChild>
                                                                <Link href={`/admin/dashboard/messaging/${log.conversationId}`}>
                                                                    View Conversation <ArrowUpRight className="h-3 w-3 ml-1" />
                                                                </Link>
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="stats" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">Total Actions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.totalActions || 0}</div>
                                <p className="text-xs text-green-500 font-medium mt-1">
                                    +{stats?.recentActions || 0} in last 24h
                                </p>
                            </CardContent>
                        </Card>
                        {/* More stats cards could go here */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">Warnings Issued</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.actionsByType?.warning || 0}</div>
                                <p className="text-xs text-gray-400 mt-1">Platform-wide</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">Active Restrictions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats?.actionsByType?.restrict || 0}</div>
                                <p className="text-xs text-gray-400 mt-1">Currently enforced</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-gray-500">Top Moderator</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xl font-bold truncate">
                                    {stats?.topModerators?.[0]?.name || "N/A"}
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    {stats?.topModerators?.[0]?.count || 0} actions performed
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Action Breakdown</CardTitle>
                                <CardDescription>Distribution of moderation actions by type.</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px] flex items-center justify-center">
                                {/* Simple bar representation since Recharts is large to bundle here if not needed */}
                                <div className="w-full space-y-4">
                                    {stats && Object.entries(stats.actionsByType).map(([type, count]) => (
                                        <div key={type} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="capitalize">{type.replace("_", " ")}</span>
                                                <span className="font-bold">{count}</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="bg-[#F3CFC6] h-full"
                                                    style={{ width: `${(count / stats.totalActions) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    {!stats && <p className="text-gray-400 italic">No data available</p>}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Top Performing Moderators</CardTitle>
                                <CardDescription>Activity leaderboard for internal oversight.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[250px]">
                                    <div className="space-y-4 pr-4">
                                        {stats?.topModerators?.map((mod, i) => (
                                            <div key={i} className="flex items-center justify-between border-b pb-2 last:border-0">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center font-bold text-xs">
                                                        {i + 1}
                                                    </div>
                                                    <span className="font-medium">{mod.name}</span>
                                                </div>
                                                <Badge variant="outline" className="border-[#F3CFC6] text-black">
                                                    {mod.count} actions
                                                </Badge>
                                            </div>
                                        ))}
                                        {(!stats || !stats.topModerators || stats.topModerators.length === 0) && (
                                            <p className="text-center py-10 text-gray-400 italic">No data available</p>
                                        )}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="bg-white dark:bg-[#1A1A1A] border-[#C4C4C4] dark:border-black">
                    <DialogHeader>
                        <DialogTitle>Edit Moderator</DialogTitle>
                        <DialogDescription>Update moderator account details. Leave password blank to keep current.</DialogDescription>
                    </DialogHeader>
                    <Form {...updateForm}>
                        <form onSubmit={updateForm.handleSubmit(onEditSubmit)} className="space-y-4 pt-4">
                            <FormField
                                control={updateForm.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Username</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={updateForm.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="email" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={updateForm.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>New Password (Optional)</FormLabel>
                                        <FormControl>
                                            <Input {...field} type="password" placeholder="••••••••" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter className="pt-4">
                                <Button type="submit" disabled={submitting} className="bg-[#E8A8A2] hover:bg-[#D49791] text-black w-full">
                                    {submitting ? "Updating..." : "Update Moderator"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="bg-white dark:bg-[#1A1A1A] border-[#C4C4C4] dark:border-black">
                    <DialogHeader>
                        <div className="flex items-center gap-2 text-red-500 mb-2">
                            <ShieldAlert className="h-6 w-6" />
                            <DialogTitle>Confirm Deletion</DialogTitle>
                        </div>
                        <DialogDescription>
                            Are you sure you want to delete moderator <strong>{selectedModerator?.username}</strong>? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setIsDeleteOpen(false)} disabled={submitting}>Cancel</Button>
                        <Button variant="destructive" onClick={onDeleteConfirm} disabled={submitting}>
                            {submitting ? "Deleting..." : "Delete Moderator"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </motion.div >
    );
}
