import { Book, Clock, TrendingUp } from "lucide-react";
import React from "react"

function CourseInfo({ course }) {
    const courseLayout = course?.courseJson?.course;
    return (
        <div>
            <div className="flex flex-col gap-3">
                <h2 className="font-bold text-2xl">{courseLayout?.name}</h2>
                <p className="line-clamp-2 text-gray-500">{courseLayout?.description}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="flex gap-5 items-center rounded-lg shadow p-3">
                        <Clock className="text-blue-500" />
                        <section>
                            <h2 className="font-bold">Duration</h2>
                            <h2>2 Hourse</h2>
                        </section>
                    </div>

                    <div className="flex gap-5 items-center rounded-lg shadow p-3">
                        <Book className="text-green-500" />
                        <section>
                            <h2 className="font-bold">Chapters</h2>
                            <h2>2 Hourse</h2>
                        </section>
                    </div>


                    <div className="flex gap-5 items-center rounded-lg shadow p-3">
                        <TrendingUp className="text-red-500" />
                        <section>
                            <h2 className="font-bold">Difficulty Level</h2>
                            <h2>{course?.level}</h2>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CourseInfo