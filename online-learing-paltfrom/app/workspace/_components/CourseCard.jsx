import Image from "next/image";
import React from "react";

function CourseCard({ course }) {
    const courseJson = course?.courseJson?.course;
    return (
        <div>
            <Image src={course?.bannerImageUrl} alt={course?.name}
                width={400}
                height={300}
                className="w-full h-[250px] rounded-xl object-cover" />
            <div>
                <h2>{courseJson?.name}</h2>
            </div>
        </div>
    )

}
export default CourseCard