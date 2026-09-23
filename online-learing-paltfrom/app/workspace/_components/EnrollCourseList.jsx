import axios from "axios";
import { index } from "drizzle-orm/pg-core";
import React, { useEffect, useState } from "react";
import EnrollCourseCard from "./EnrollCourseCard";

function EnrollCourseList() {

    const [enrolledcoursedList, setEnrolledCourseList] = useState();

    useEffect(() => {
        GetEnrolledCourse();
    }, [])

    const GetEnrolledCourse = async () => {
        const result = await axios.get('/api/enroll-course');

        console.log(result);
        setEnrolledCourseList(result.data);

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