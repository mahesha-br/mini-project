"use client";
import React from "react";
import { useUser } from "@clerk/nextjs";

function WelcomeBanner() {
    const { user } = useUser();

    return (
        <div className="p-6 bg-gray-700 rounded-2xl text-white shadow-md">
            <h2 className="font-bold text-2xl md:text-3xl">
                Welcome to Online Learning Platform
            </h2>
            <p className="text-white/80 mt-1 text-sm md:text-base">
                Learn, Create, and Explore your favorite courses
            </p>
        </div>
    );
}

export default WelcomeBanner;