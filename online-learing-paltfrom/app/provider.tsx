'use client';

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

interface ProviderProps {
  children: React.ReactNode;
}

export default function Provider({ children }: ProviderProps) {
  const { user, isLoaded, isSignedIn } = useUser();
  const [dbUser, setDbUser] = useState<any>(null);

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

      const resp = await fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name,
          email: email,
        }),
      });

      const data = await resp.json();
      setDbUser(data);
      console.log("Database user sync:", data);
    } catch (error) {
      console.error("Failed to check/create user:", error);
    }
  };

  return (
    <div>{children}</div>
  );
}


