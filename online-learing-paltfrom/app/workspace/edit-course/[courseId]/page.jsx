"use client"
import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import axios from "axios";

function editCourse() {
    const { courseId } = useParams();
    const [loading, setLoading] = useState(false);
    console.log(courseId);

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
    }
    return (
        <div>editCourse</div>
    )
}

export default editCourse