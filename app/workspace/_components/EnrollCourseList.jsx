"use client";
import axios from "axios";
import React, { useEffect, useState } from "react";
import EnrollCourseCard from "./EnrollCourseCard";
import { EnrollCourseListSkeleton } from "@/components/loading/course-skeletons";

function EnrollCourseList() {

    const [enrolledcoursedList, setEnrolledCourseList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        GetEnrolledCourse();
    }, []);

    const GetEnrolledCourse = async () => {
        setLoading(true);
        try {
            const result = await axios.get('/api/enroll-course');
            setEnrolledCourseList(result.data || []);
        } catch (error) {
            console.error("Error fetching enrolled courses:", error);
            setEnrolledCourseList([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <EnrollCourseListSkeleton />;
    }

    return enrolledcoursedList?.length > 0 && (
        <div className="mt-3">
            <h2 className="font-bold text-xl">Continue Learning your courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                {enrolledcoursedList?.map((item, index) => (
                    <EnrollCourseCard course={item?.courses || item?.course || item} enrollCourse={item?.enrollCourse} key={index} />
                ))}
            </div>
        </div>
    )

}
export default EnrollCourseList