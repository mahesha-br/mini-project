import React from "react"

function CourseInfo({ course }) {
    const courseLayout = course?.courseJson?.course;
    return (
        <div>
            <div>
                <h2 className="font-bold text-2xl">{courseLayout?.name}</h2>
                <p className="line-clamp-2">{courseLayout?.description}</p>
            </div>
        </div>
    )
}

export default CourseInfo