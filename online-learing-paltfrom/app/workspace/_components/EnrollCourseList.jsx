import axios from "axios";
import React, { useEffect } from "react";

function EnrollCourseList() {

    useEffect(() => {
        GetEnrolledCourse();
    }, [])

    const GetEnrolledCourse = async () => {
        const result = await axios.get('/api/enroll-course');

        console.log(result);

    }

    return (
        <div>
            EnrollCourseList
        </div>
    )

}
export default EnrollCourseList