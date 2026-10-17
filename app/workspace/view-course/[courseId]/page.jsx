"use client"
import React from "react";
import EditCourse from "../../edit-course/[courseId]/page";

function ViewCourse() {
    return (
        <div>
            <EditCourse ViewCourse={true} />
        </div>
    );
}

export default ViewCourse;