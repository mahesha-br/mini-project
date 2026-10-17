"use client"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import { Search } from "lucide-react";
import React, { useEffect, useState } from "react";
import CourseCard from "../_components/CourseCard";
import { CourseCardGridSkeleton } from "@/components/loading/course-skeletons";

function Explore() {
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
            const result = await axios.get('/api/courses?courseId=0');
            setCourseList(result.data || []);
        } catch (error) {
            console.error("Error fetching explore courses:", error);
        } finally {
            setLoading(false);
        }
    };

    const showSkeleton = !isLoaded || loading;

    return (
        <div>
            <h2 className="font-bold text-3xl mb-6">Explore More Courses</h2>
            <div className="flex gap-5 max-w-md" >
                <Input placeholder="Search" disabled={showSkeleton} />
                <Button disabled={showSkeleton}><Search />Search</Button>
            </div>

            {showSkeleton ? (
                <CourseCardGridSkeleton count={6} className="mt-6" />
            ) : courseList.length === 0 ? (
                <p className="mt-8 text-center text-muted-foreground text-sm">
                    No published courses yet. Check back soon.
                </p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5 mt-6">
                    {courseList.map((course, index) => (
                        <CourseCard course={course} key={course?.cid ?? index} />
                    ))}
                </div>
            )}

        </div>
    )
}

export default Explore