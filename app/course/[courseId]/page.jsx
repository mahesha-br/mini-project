"use client"
import AppHeader from "@/app/workspace/_components/AppHeader";
import React, { useEffect, useState } from "react";
import ChapterListSidebar from "../_components/ChaptyerListSidebar";
import ChapterContent from "../_components/ChapterContent";
import { useParams } from "next/navigation";
import axios from "axios";
import { CoursePlayerSkeleton } from "@/components/loading/course-skeletons";
import { Button } from "@/components/ui/button";
import { RefreshCw, WifiOff } from "lucide-react";

function Course() {
    const { courseId } = useParams();
    const [courseInfo, setCourseInfo] = useState();
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    useEffect(() => {
        if (courseId) {
            GetEnrolledCourseById();
        }
    }, [courseId]);

    const GetEnrolledCourseById = async ({ showPageLoader = true } = {}) => {
        if (showPageLoader) setLoading(true);
        setFetchError(null);
        try {
            const result = await axios.get('/api/enroll-course?courseId=' + courseId);
            setCourseInfo(result.data);
        } catch (error) {
            console.error("Error fetching course:", error);
            setFetchError(error?.response?.data?.error || "Could not load course. Please check your connection and retry.");
        } finally {
            if (showPageLoader) setLoading(false);
        }
    };

    return (
        <div>
            <AppHeader hideSidebar={true} />
            {loading ? (
                <CoursePlayerSkeleton />
            ) : fetchError ? (
                <div className="p-10 max-w-md mx-auto text-center space-y-4">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto">
                        <WifiOff className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-base">Connection Issue</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            {fetchError}
                        </p>
                    </div>
                    <Button onClick={() => GetEnrolledCourseById()} size="sm" className="gap-2 cursor-pointer">
                        <RefreshCw className="w-4 h-4" /> Try Again
                    </Button>
                </div>
            ) : !courseInfo ? (
                <p className="p-10 text-center text-muted-foreground text-sm">
                    Course not found or you are not enrolled. Enroll from Explore to start learning.
                </p>
            ) : (
                <div className="flex gap-5">
                    <ChapterListSidebar courseInfo={courseInfo} />
                    <div className="flex-1">
                        <ChapterContent courseInfo={courseInfo} refreshData={() => GetEnrolledCourseById({ showPageLoader: false })} />
                    </div>
                </div>
            )}
        </div>
    );
}
export default Course;