"use client"
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import axios from "axios";
import CourseInfo from "../_components/CourseInfo";
import { Loader2 } from "lucide-react";
import ChapterTopicList from "../_components/ChapterTopicList";

function editCourse() {
    const { courseId } = useParams();
    const [loading, setLoading] = useState(true);
    const [course, setCourse] = useState();

    useEffect(() => {
        if (courseId) {
            GetCourseInfo();
        }
    }, [courseId])

    const GetCourseInfo = async () => {
        setLoading(true);
        try {
            const result = await axios.get('/api/courses?courseId=' + courseId);
            setCourse(result.data);
        } catch (error) {
            console.error("Error fetching course:", error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[300px] flex-col gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm">Loading course details...</p>
            </div>
        );
    }

    return (
        <div className="p-5">
            <CourseInfo course={course} refreshData={GetCourseInfo} />
            <ChapterTopicList course={course} />
        </div>
    );
}

export default editCourse;