// src/app/dashboard/profile/[id]/BlockDialog.tsx

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface BlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isBlocked: boolean;
  profileName: string;
  onConfirm: () => Promise<void>;
}

export default function BlockDialog({
  open,
  onOpenChange,
  isBlocked,
  profileName,
  onConfirm,
}: BlockDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isBlocked ? "Unblock" : "Block"} {profileName}?
          </DialogTitle>
          <DialogDescription className="space-y-3 pt-2">
            {isBlocked ? (
              <p>
                Are you sure you want to unblock {profileName}? They will be able to
                view your profile, send you messages, and interact with you again.
              </p>
            ) : (
              <>
                <p className="font-medium text-foreground">
                  Blocking {profileName} will:
                </p>
                <ul className="space-y-1.5 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-[#F3CFC6] mt-0.5">•</span>
                    <span>Hide your profile from them</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F3CFC6] mt-0.5">•</span>
                    <span>Prevent them from messaging you</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F3CFC6] mt-0.5">•</span>
                    <span>Remove them from your professionals directory</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F3CFC6] mt-0.5">•</span>
                    <span>Prevent appointment bookings</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#F3CFC6] mt-0.5">•</span>
                    <span>Hide existing conversations</span>
                  </li>
                </ul>
                <p className="text-xs text-muted-foreground italic">
                  They will not be notified that you blocked them.
                </p>
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant={isBlocked ? "default" : "destructive"}
            onClick={onConfirm}
          >
            {isBlocked ? "Unblock" : "Block User"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
