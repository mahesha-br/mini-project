'use client'
import { Button } from "@/components/ui/button";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import AddNewCourseDialog from "./AddNewCourseDialog";
import axios from "axios";
import { useUser } from "@clerk/nextjs";

function CourseList() {
    const [courseList, setCourseList] = useState([]);
    const { user } = useUser();

    useEffect(() => {
        user && GetCourseList();
    }, [user])
    const GetCourseList = async () => {
        const result = await axios.get('/api/courses');
        console.log(result.data);
    }
    return (
        <div className="mt-10">
            <h2 className="font-bold text-3xl">My Course List</h2>
            {courseList?.length == 0 ?

                <div className="flex p-7 items-center justify-center flex-col border rounded-lx shadow-sm mt-2 bg-secondary">
                    <Image src={'/ai_learning_logo_only.svg'} alt='edu' width={80} height={80} />
                    <h2 className="my-2 text-xl font-bold">Look like you haven't created any courses yet</h2>
                    <AddNewCourseDialog>
                        <Button>+ Create your first course</Button>
                    </AddNewCourseDialog>
                </div> :
                <div>
                    List of Courses
                </div>
            }
        </div>
    );
}

export default CourseList;