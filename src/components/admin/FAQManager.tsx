"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { createFAQ, updateFAQ, deleteFAQ } from "@/actions/admin/help-center";
import { useRouter } from "next/navigation";

// Define FAQ type based on Schema
type FAQ = {
    id: string;
    question: string;
    answer: string;
    order: number;
    isActive: boolean;
};

export default function FAQManager({ initialData }: { initialData: FAQ[] }) {
    const router = useRouter();
    const [faqs, setFaqs] = useState<FAQ[]>(initialData);

    // Sync state with props when server data changes (e.g. after refresh)
    useEffect(() => {
        setFaqs(initialData);
    }, [initialData]);
    const [isOpen, setIsOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        question: "",
        answer: "",
        order: 0,
        isActive: true,
    });
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const [isLoading, setIsLoading] = useState(false);

    const resetForm = () => {
        setFormData({ question: "", answer: "", order: faqs.length + 1, isActive: true });
        setEditingId(null);
    };

    const handleOpen = (faq?: FAQ) => {
        if (faq) {
            setEditingId(faq.id);
            setFormData({
                question: faq.question,
                answer: faq.answer,
                order: faq.order,
                isActive: faq.isActive,
            });
        } else {
            resetForm();
        }
        setIsOpen(true);
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            if (editingId) {
                const res = await updateFAQ(editingId, formData);
                if (res.success) {
                    toast.success("FAQ updated");
                    setIsOpen(false);
                    router.refresh(); // Refresh server data
                    // Optimistic update
                    setFaqs(faqs.map(f => f.id === editingId ? { ...f, ...formData } : f));
                } else {
                    toast.error("Failed to update FAQ");
                }
            } else {
                const res = await createFAQ(formData);
                if (res.success) {
                    toast.success("FAQ created");
                    setIsOpen(false);
                    router.refresh();
                    // We can't optimistically update nicely without the ID, so just rely on refresh or refetch
                    // But to be smooth, we could refetch.
                } else {
                    toast.error("Failed to create FAQ");
                }
            }
        } catch {
            toast.error("An error occurred");
        }
        setIsLoading(false);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setIsLoading(true);
        const res = await deleteFAQ(deleteId);
        if (res.success) {
            toast.success("FAQ deleted");
            setFaqs(faqs.filter(f => f.id !== deleteId));
            setIsDeleteOpen(false);
            router.refresh();
        } else {
            toast.error("Failed to delete FAQ");
        }
        setIsLoading(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">FAQs</h2>
                <Button onClick={() => handleOpen()} className="bg-[#E7C4BB] text-black hover:bg-[#d4a8a0]">
                    <Plus className="mr-2 h-4 w-4" /> Add FAQ
                </Button>
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Order</TableHead>
                            <TableHead>Question</TableHead>
                            <TableHead>Active</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {faqs.map((faq) => (
                            <TableRow key={faq.id}>
                                <TableCell>{faq.order}</TableCell>
                                <TableCell className="font-medium">{faq.question}</TableCell>
                                <TableCell>{faq.isActive ? "Yes" : "No"}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleOpen(faq)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => { setDeleteId(faq.id); setIsDeleteOpen(true); }} className="text-red-500">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {faqs.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">
                                    No FAQs found. Create one to get started.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Edit/Create Dialog */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit FAQ" : "Create New FAQ"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Question</Label>
                            <Input
                                value={formData.question}
                                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                                placeholder="What is...?"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Answer</Label>
                            <Textarea
                                value={formData.answer}
                                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                                placeholder="The answer is..."
                            />
                        </div>
                        <div className="flex gap-4">
                            <div className="space-y-2 w-1/2">
                                <Label>Order</Label>
                                <Input
                                    type="number"
                                    value={formData.order}
                                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="space-y-2 w-1/2 flex flex-col justify-end pb-2">
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        checked={formData.isActive}
                                        onCheckedChange={(c) => setFormData({ ...formData, isActive: c })}
                                    />
                                    <Label>Active</Label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={isLoading || !formData.question || !formData.answer}>
                            {isLoading ? "Saving..." : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Delete</DialogTitle>
                    </DialogHeader>
                    <p>Are you sure you want to delete this FAQ? This action cannot be undone.</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                            {isLoading ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
