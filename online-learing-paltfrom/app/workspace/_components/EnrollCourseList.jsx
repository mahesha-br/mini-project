import axios from "axios";
import React, { useEffect, useState } from "react";

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
        </div>
    )

}
export default EnrollCourseList