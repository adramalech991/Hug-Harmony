"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [companyCutPercentage, setCompanyCutPercentage] = useState<number>(20);
  const [travelRatePerMile, setTravelRatePerMile] = useState<number>(1.5);
  const [verifiedBadgePrice, setVerifiedBadgePrice] = useState<number>(29);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user?.isAdmin) {
      router.push("/admin/dashboard");
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    if (!session?.user?.isAdmin) return;
    async function fetchSettings() {
      try {
        const [cutRes, rateRes, badgeRes] = await Promise.all([
          fetch("/api/settings/company-cut"),
          fetch("/api/settings/travel-rate"),
          fetch("/api/settings/verified-badge-price")
        ]);

        if (!cutRes.ok) throw new Error("Failed to fetch company cut");
        if (!rateRes.ok) throw new Error("Failed to fetch travel rate");
        if (!badgeRes.ok) throw new Error("Failed to fetch badge price");

        const cutData = await cutRes.json();
        const rateData = await rateRes.json();
        const badgeData = await badgeRes.json();

        setCompanyCutPercentage(cutData.companyCutPercentage);
        setTravelRatePerMile(rateData.travelRatePerMile);
        setVerifiedBadgePrice(badgeData.verifiedBadgePrice);
      } catch (error) {
        console.error("Fetch settings error:", error);
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, [session?.user?.isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (companyCutPercentage < 0 || companyCutPercentage > 100) {
      toast.error("Company cut percentage must be between 0 and 100");
      return;
    }
    setSubmitting(true);
    try {
      const [cutRes, rateRes, badgeRes] = await Promise.all([
        fetch("/api/settings/company-cut", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ companyCutPercentage }),
        }),
        fetch("/api/settings/travel-rate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ travelRatePerMile }),
        }),
        fetch("/api/settings/verified-badge-price", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ verifiedBadgePrice }),
        })
      ]);

      if (!cutRes.ok) throw new Error("Failed to update company cut");
      if (!rateRes.ok) throw new Error("Failed to update travel rate");
      if (!badgeRes.ok) throw new Error("Failed to update badge price");

      toast.success("Settings updated successfully");
    } catch (error) {
      console.error("POST settings error:", error);
      toast.error("Failed to update settings");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      className="space-y-6 max-w-7xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Card className="bg-gradient-to-r from-[#F3CFC6] to-[#C4C4C4] text-black dark:text-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Settings</CardTitle>
          <p className="text-sm opacity-80">Manage application settings</p>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="p-4">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label
                    htmlFor="companyCutPercentage"
                    className="text-black dark:text-white"
                  >
                    Company Cut Percentage (%)
                  </Label>
                  <Input
                    id="companyCutPercentage"
                    type="number"
                    value={companyCutPercentage}
                    onChange={(e) =>
                      setCompanyCutPercentage(Number(e.target.value))
                    }
                    className="border-[#C4C4C4] focus:ring-[#F3CFC6] dark:bg-black dark:text-white dark:border-[#C4C4C4]"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="travelRatePerMile"
                    className="text-black dark:text-white"
                  >
                    Travel Rate per Mile ($)
                  </Label>
                  <Input
                    id="travelRatePerMile"
                    type="number"
                    value={travelRatePerMile}
                    onChange={(e) =>
                      setTravelRatePerMile(Number(e.target.value))
                    }
                    className="border-[#C4C4C4] focus:ring-[#F3CFC6] dark:bg-black dark:text-white dark:border-[#C4C4C4]"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="verifiedBadgePrice"
                    className="text-black dark:text-white"
                  >
                    Verified Badge Price ($)
                  </Label>
                  <Input
                    id="verifiedBadgePrice"
                    type="number"
                    value={verifiedBadgePrice}
                    onChange={(e) =>
                      setVerifiedBadgePrice(Number(e.target.value))
                    }
                    className="border-[#C4C4C4] focus:ring-[#F3CFC6] dark:bg-black dark:text-white dark:border-[#C4C4C4]"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className="bg-[#F3CFC6] text-black hover:bg-[#fff]/80"
              >
                {submitting ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
