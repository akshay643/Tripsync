"use client";

import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { generateInviteLink } from "@/lib/utils";

interface InviteSheetProps {
  tripId: string;
  tripTitle: string;
}

export function InviteSheet({ tripId, tripTitle }: InviteSheetProps) {
  const [copied, setCopied] = useState(false);
  const link = generateInviteLink(tripId);

  async function handleCopy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({
        title: `Join ${tripTitle} on TripSync`,
        text: `You're invited to join ${tripTitle}!`,
        url: link,
      });
    } else {
      handleCopy();
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="h-4 w-4" />
          Invite
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite to {tripTitle}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Share this link with friends to invite them to the trip.
          </p>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 p-3 bg-gray-50">
            <span className="flex-1 text-sm text-gray-700 truncate font-mono">{link}</span>
            <button
              onClick={handleCopy}
              className="text-gray-400 hover:text-indigo-600 transition-colors"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <Button className="w-full gap-2" onClick={handleShare}>
            <Share2 className="h-4 w-4" />
            Share Link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
