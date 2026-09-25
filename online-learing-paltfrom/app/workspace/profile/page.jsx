"use client";

import { UserProfile } from "@clerk/nextjs";
import { useAuth } from "@clerk/nextjs";
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

function Profile() {
    const { isLoaded } = useAuth();

    return (
        <div>
            <h2 className="font-bold text-3xl mb-7">Manage your profile</h2>
            {!isLoaded ? (
                <div className="max-w-3xl space-y-4">
                    <Skeleton className="h-10 w-full rounded-lg" />
                    <Skeleton className="h-64 w-full rounded-xl" />
                    <Skeleton className="h-48 w-full rounded-xl" />
                </div>
            ) : (
                <UserProfile routing="hash" />
            )}
        </div>
    );
}

export default Profile;