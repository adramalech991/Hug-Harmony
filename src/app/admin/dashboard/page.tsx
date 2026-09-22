"use client";

import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Users,
  BarChart,
  Package,
  Video,
  HeartPulse,
  AlertTriangle,
  MessageCircle,
  Briefcase,
  UserPlus,
  FileQuestion,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export default function AdminDashboardPage() {
  const { data: session } = useSession();

  const admin: AdminUser = {
    id: session?.user?.id || "admin_1",
    name: session?.user?.name || "Admin",
    email: session?.user?.email || "admin@example.com",
    avatar: session?.user?.image || "/assets/images/avatar-placeholder.png",
  };

  const dashboardItems = [
    {
      href: "/admin/dashboard/users",
      label: "Users",
      icon: <Users className="h-8 w-8 text-[#F3CFC6]" />,
      description: "Manage registered users and their profiles.",
    },
    {
      href: "/admin/dashboard/professionals",
      label: "Professionals",
      icon: <Briefcase className="h-8 w-8 text-[#F3CFC6]" />,
      description: "View and edit professional details.",
    },
    {
      href: "/admin/dashboard/professional-applications",
      label: "Applications",
      icon: <UserPlus className="h-8 w-8 text-[#F3CFC6]" />,
      description: "Review professional applications.",
    },
    {
      href: "/admin/dashboard/operations",
      label: "Operations",
      icon: <AlertTriangle className="h-8 w-8 text-[#F3CFC6]" />,
      description: "Manage feedback, reports, and violations.",
    },
    {
      href: "/admin/dashboard/messaging",
      label: "Messaging Oversight",
      icon: <MessageCircle className="h-8 w-8 text-[#F3CFC6]" />,
      description: "Monitor and manage user conversations.",
    },
    {
      href: "/admin/dashboard/stats",
      label: "App Stats",
      icon: <BarChart className="h-8 w-8 text-[#F3CFC6]" />,
      description: "Analyze application metrics and trends.",
    },
    {
      href: "/admin/dashboard/merchandise",
      label: "Merchandise",
      icon: <Package className="h-8 w-8 text-[#F3CFC6]" />,
      description: "Manage merchandise.",
    },
    {
      href: "/admin/dashboard/training-videos",
      label: "Training Videos",
      icon: <Video className="h-8 w-8 text-[#F3CFC6]" />,
      description: "Manage training videos.",
    },
    {
      href: "/admin/dashboard/quizzes",
      label: "Training Quizzes",
      icon: <FileQuestion className="h-8 w-8 text-[#F3CFC6]" />,
      description: "Manage certification quizzes and onboarding assessments.",
    },
    {
      href: "/admin/dashboard/moderators",
      label: "Moderation Center",
      icon: <ShieldCheck className="h-8 w-8 text-[#F3CFC6]" />,
      description: "View moderation actions, warnings, and audit logs.",
    },
    {
      href: "/admin/dashboard/application-health",
      label: "Application Health",
      icon: <HeartPulse className="h-8 w-8 text-[#F3CFC6]" />,
      description: "Monitor system performance.",
    },
  ];

  return (
    <motion.div
      className="space-y-6 w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Welcome Section */}
      <Card className="bg-gradient-to-r from-[#F3CFC6] to-[#C4C4C4] text-black dark:text-white shadow-lg">
        <CardHeader>
          <motion.div
            className="flex items-center space-x-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Avatar className="h-16 w-16 border-2 border-white">
              <AvatarImage src={admin.avatar} alt={admin.name} />
              <AvatarFallback className="bg-[#C4C4C4] text-black">
                {admin.name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl font-bold">
                Welcome to Hug Harmony, {admin.name}
              </CardTitle>
              <p className="text-sm opacity-80">
                Oversee Cuddlers, Clients, and Safety with Confidence.
              </p>
            </div>
          </motion.div>
        </CardHeader>
      </Card>

      {/* Dashboard Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardItems.filter(item => {
          if (session?.user?.isAdmin) return true;
          const moderatorAllowed = [
            "/admin/dashboard/users",
            "/admin/dashboard/professionals",
            "/admin/dashboard/operations",
            "/admin/dashboard/messaging",
            "/admin/dashboard/moderators",
          ];
          return moderatorAllowed.includes(item.href);
        }).map((item) => (
          <motion.div
            key={item.href}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
            }}
            transition={{ duration: 0.2 }}
          >
            <Link href={item.href}>
              <Card className="hover:bg-[#fff]/80 dark:hover:bg-[#C4C4C4]/20 transition-colors">
                <CardContent className="flex items-center space-x-4 p-6">
                  {item.icon}
                  <div>
                    <h3 className="text-lg font-semibold text-black dark:text-white">
                      {item.label}
                    </h3>
                    <p className="text-sm text-[#C4C4C4]">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
