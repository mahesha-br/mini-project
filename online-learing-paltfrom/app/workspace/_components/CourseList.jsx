'use client'
import { Button } from "@/components/ui/button";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import AddNewCourseDialog from "./AddNewCourseDialog";
import axios from "axios";
import { useUser } from "@clerk/nextjs";
import CourseCard from "./CourseCard";
import { CourseCardGridSkeleton } from "@/components/loading/course-skeletons";

function CourseList() {
    const [courseList, setCourseList] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user, isLoaded } = useUser();

    useEffect(() => {
        if (!isLoaded) return;
        if (!user) {
            setLoading(false);
            return;
        }
        GetCourseList();
    }, [user, isLoaded]);

    const GetCourseList = async () => {
        setLoading(true);
        try {
            const result = await axios.get('/api/courses');
            setCourseList(result.data);
        } catch (error) {
            console.error("Error fetching courses:", error);
        } finally {
            setLoading(false);
        }
    };

    const showSkeleton = !isLoaded || loading;

    return (
        <div className="mt-10">
            <h2 className="font-bold text-xl">My Course List</h2>
            {showSkeleton ? (
                <CourseCardGridSkeleton count={3} className="mt-2" />
            ) : courseList?.length == 0 ?

                <div className="flex p-7 items-center justify-center flex-col border rounded-lx shadow-sm mt-2 bg-secondary">
                    <Image src={'/ai_learning_logo_only.svg'} alt='edu' width={80} height={80} />
                    <h2 className="my-2 text-xl font-bold">Look like you haven't created any courses yet</h2>
                    <AddNewCourseDialog>
                        <Button>+ Create your first course</Button>
                    </AddNewCourseDialog>
                </div> :
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                    {courseList.map((course, index) => (
                        <CourseCard course={course} key={index} />
                    ))}
                </div>
            }
        </div>
    );
}

export default CourseList;