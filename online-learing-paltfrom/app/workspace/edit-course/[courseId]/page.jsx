"use client"
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import axios from "axios";
import CourseInfo from "../_components/CourseInfo";

function editCourse() {
    const { courseId } = useParams();
    const [loading, setLoading] = useState(false);
    const [course, setCourse] = useState();

    useEffect(() => {
        if (courseId) {
            GetCourseInfo();
        }
    }, [courseId])

    const GetCourseInfo = async () => {
        setLoading(true);
        const result = await axios.get('/api/courses?courseId=' + courseId);
        console.log(result.data);
        setLoading(false);
        setCourse(result.data);
    }
    return (
        <div>
            <CourseInfo course={course} />
        </div>
    )
}

export default editCourse