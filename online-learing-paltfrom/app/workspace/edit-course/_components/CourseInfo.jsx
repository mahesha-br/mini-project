import React from "react"

function CourseInfo({ course }) {
    const courseLayout = course?.courseJson?.course;
    return (
        <div>
            <div>
                <h2>{courseLayout?.name}</h2>
            </div>
        </div>
    )
}

export default CourseInfo