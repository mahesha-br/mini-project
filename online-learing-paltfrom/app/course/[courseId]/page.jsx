"use client"
import AppHeader from "@/app/workspace/_components/AppHeader";
import React, { useEffect, useState } from "react";
import ChapterListSidebar from "../_components/ChaptyerListSidebar";
import ChapterContent from "../_components/ChapterContent";
import { useParams } from "next/navigation";
import axios from "axios";

function Course() {
    const { courseId } = useParams();
    const [courseInfo, setCourseInfo] = useState();

    useEffect(() => {
        if (courseId) {
            GetEnrolledCourseById();
        }
    }, [courseId]);

    const GetEnrolledCourseById = async () => {
        try {
            const result = await axios.get('/api/enroll-course?courseId=' + courseId);
            console.log(result);
            setCourseInfo(result.data);
        } catch (error) {
            console.error("Error fetching course:", error);
        }
    };

    return (
        <div>
            <AppHeader hideSidebar={true} />
            <div className="flex gap-10">
                <ChapterListSidebar courseInfo={courseInfo} />
                <ChapterContent courseInfo={courseInfo} />
            </div>
        </div>
    );
}
export default Course;