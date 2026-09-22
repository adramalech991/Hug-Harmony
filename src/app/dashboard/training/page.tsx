// src/app/dashboard/training/page.tsx
import { Suspense } from "react";
import TrainingPageContent from "./TrainingPageContent";
import { Skeleton } from "@/components/ui/skeleton";

function TrainingLoadingSkeleton() {
    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
            <div className="space-y-2">
                <Skeleton className="h-9 w-72" />
                <Skeleton className="h-5 w-96" />
            </div>
            <div className="space-y-6">
                <Skeleton className="h-10 w-[400px]" />
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    );
}

export default function ProfessionalTrainingPage() {
    return (
        <Suspense fallback={<TrainingLoadingSkeleton />}>
            <TrainingPageContent />
        </Suspense>
    );
}