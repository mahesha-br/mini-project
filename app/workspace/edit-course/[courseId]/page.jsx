"use client"
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import axios from "axios";
import CourseInfo from "../_components/CourseInfo";
import ChapterTopicList from "../_components/ChapterTopicList";
import { EditCoursePageSkeleton } from "@/components/loading/course-skeletons";

function EditCourse({ ViewCourse = false }) {
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
        return <EditCoursePageSkeleton />;
    }

    if (!course) {
        return (
            <p className="p-5 text-center text-muted-foreground text-sm">
                Could not load this course. It may have been removed or you do not have access.
            </p>
        );
    }

    return (
        <div className="p-5">
            <CourseInfo course={course} refreshData={GetCourseInfo} ViewCourse={ViewCourse} />
            <ChapterTopicList course={course} />
        </div>
    );
}

export default EditCourse;