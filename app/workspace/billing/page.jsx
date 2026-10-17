"use client";

import { PricingTable } from "@clerk/nextjs";
import { useAuth } from "@clerk/nextjs";
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

function Billing() {
    const { isLoaded } = useAuth();

    return (
        <div>
            <h2 className="font-bold text-3xl mb-5">Select Plan</h2>
            {!isLoaded ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
                    <Skeleton className="h-72 rounded-xl" />
                    <Skeleton className="h-72 rounded-xl" />
                </div>
            ) : (
                <PricingTable />
            )}
        </div>
    )
}

export default Billing