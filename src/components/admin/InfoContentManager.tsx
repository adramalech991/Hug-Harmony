"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2, GripVertical, Save, X } from "lucide-react";
import RichTextEditor from "@/components/RichTextEditor";
import {
    createInfoContent,
    updateInfoContent,
    deleteInfoContent,
    updateInfoContent as updateOrderAction // reuse for order if needed
} from "@/actions/admin/help-center";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

type InfoContent = {
    id: string;
    title: string;
    content: string;
    key?: string | null;
    order: number;
    updatedAt: Date | string;
};

export default function InfoContentManager({
    initialContents,
}: {
    initialContents: InfoContent[];
}) {
    const router = useRouter();
    const [contents, setContents] = useState<InfoContent[]>(initialContents);
    const [isLoading, setIsLoading] = useState(false);

    // Edit/Add Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<InfoContent> | null>(null);
    const [dialogTitle, setDialogTitle] = useState("");

    useEffect(() => {
        setContents(initialContents);
    }, [initialContents]);

    const handleAdd = () => {
        setDialogTitle("Add Custom Content");
        setEditingItem({ title: "", content: "", order: contents.length });
        setIsDialogOpen(true);
    };

    const handleEdit = (item: InfoContent) => {
        setDialogTitle("Edit Custom Content");
        setEditingItem(item);
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!editingItem?.title || !editingItem?.content) {
            toast.error("Title and content are required");
            return;
        }

        setIsLoading(true);
        try {
            if (editingItem.id) {
                // Update
                const res = await updateInfoContent(editingItem.id, {
                    title: editingItem.title,
                    content: editingItem.content,
                });
                if (res.success) {
                    toast.success("Content updated successfully");
                } else {
                    toast.error(res.error || "Failed to update content");
                }
            } else {
                // Create
                const res = await createInfoContent({
                    title: editingItem.title,
                    content: editingItem.content,
                    order: editingItem.order,
                });
                if (res.success) {
                    toast.success("Content created successfully");
                } else {
                    toast.error(res.error || "Failed to create content");
                }
            }
            setIsDialogOpen(false);
            router.refresh();
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this content?")) return;

        setIsLoading(true);
        try {
            const res = await deleteInfoContent(id);
            if (res.success) {
                toast.success("Content deleted successfully");
                router.refresh();
            } else {
                toast.error(res.error || "Failed to delete content");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Content Management</h2>
                <Button onClick={handleAdd} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" /> Add Content
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {contents.map((item) => (
                    <Card key={item.id} className="hover:shadow-sm transition-shadow">
                        <CardHeader className="py-4 px-6 flex flex-row items-center justify-between space-y-0">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-gray-100 rounded-md">
                                    <GripVertical className="w-4 h-4 text-gray-400" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-medium">
                                        {item.title}
                                        {item.key && (
                                            <span className="ml-2 px-2 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded uppercase font-bold tracking-wider">
                                                System: {item.key}
                                            </span>
                                        )}
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        Last updated: {new Date(item.updatedAt).toLocaleDateString()}
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEdit(item)}
                                    className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </Button>
                                {(!item.key || (item.key !== "terms" && item.key !== "privacy")) && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(item.id)}
                                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                    </Card>
                ))}

                {contents.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg bg-gray-50/50">
                        <p className="text-gray-500">No custom content found. Click &quot;Add Content&quot; to get started.</p>
                    </div>
                )}
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>{dialogTitle}</DialogTitle>
                        <DialogDescription>
                            Create or update informational content that will be searchable by users.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4 flex-1 overflow-y-auto pr-2">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={editingItem?.title || ""}
                                onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                                placeholder="e.g. Refund Policy, Community Guidelines"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Content</Label>
                            <div className="border rounded-md min-h-[400px]">
                                <RichTextEditor
                                    value={editingItem?.content || ""}
                                    onChange={(val) => setEditingItem({ ...editingItem, content: val })}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-4 border-t">
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                            {isLoading ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Content</>}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
