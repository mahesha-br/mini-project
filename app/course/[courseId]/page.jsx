"use client"
import AppHeader from "@/app/workspace/_components/AppHeader";
import React, { useEffect, useState } from "react";
import ChapterListSidebar from "../_components/ChaptyerListSidebar";
import ChapterContent from "../_components/ChapterContent";
import { useParams } from "next/navigation";
import axios from "axios";
import { CoursePlayerSkeleton } from "@/components/loading/course-skeletons";

function Course() {
    const { courseId } = useParams();
    const [courseInfo, setCourseInfo] = useState();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (courseId) {
            GetEnrolledCourseById();
        }
    }, [courseId]);

    const GetEnrolledCourseById = async ({ showPageLoader = true } = {}) => {
        if (showPageLoader) setLoading(true);
        try {
            const result = await axios.get('/api/enroll-course?courseId=' + courseId);
            setCourseInfo(result.data);
        } catch (error) {
            console.error("Error fetching course:", error);
        } finally {
            if (showPageLoader) setLoading(false);
        }
    };

    return (
        <div>
            <AppHeader hideSidebar={true} />
            {loading ? (
                <CoursePlayerSkeleton />
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