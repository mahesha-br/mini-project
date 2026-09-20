'use client';

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { UserDetailContext } from "@/context/UserDetailContext";

interface ProviderProps {
  children: React.ReactNode;
}

export default function Provider({ children }: ProviderProps) {
  const { user, isLoaded, isSignedIn } = useUser();
  const [userDetail, setUserDetail] = useState<any>(null);

  useEffect(() => {
    if (isLoaded && isSignedIn && user) {
      checkIsNewUser();
    }
  }, [user, isLoaded, isSignedIn]);

  const checkIsNewUser = async () => {
    try {
      const email = user?.primaryEmailAddress?.emailAddress;
      const name = user?.fullName || user?.firstName || email || "User";

      if (!email) return;

      const result = await fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          email: email,
        }),
      });

      if (!result.ok) {
        console.error("Failed to sync user, server status:", result.status);
        return;
      }

      const data = await result.json();
      if (data && !data.error) {
        setUserDetail(data);
        console.log("Database user sync:", data);
      }
    } catch (error) {
      console.error("Failed to check/create user:", error);
    }
  };

  return (
    <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
      <div>{children}</div>
    </UserDetailContext.Provider>
  );
}
