'use client';

import React from "react";

interface ProviderProps {
  children: React.ReactNode;
}

export default function Provider({ children }: ProviderProps) {
  return (
    <div>{children}</div>
  );
}
