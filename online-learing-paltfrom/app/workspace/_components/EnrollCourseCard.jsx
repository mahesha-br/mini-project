import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Book } from "lucide-react";

const DEFAULT_BANNER = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80";

function EnrollCourseCard({ course, enrollCourse }) {
    const targetCourse = course?.courses || course?.course || course;
    const courseJson = targetCourse?.courseJson?.course || targetCourse?.courseJson;
    const courseName = courseJson?.name || targetCourse?.name || "Untitled Course";
    const courseDescription = courseJson?.description || targetCourse?.description || "";
    const noOfChapters = courseJson?.noOfChapters || targetCourse?.noOfChapters;

    const initialBanner = targetCourse?.bannerImageUrl || DEFAULT_BANNER;
    const [imgSrc, setImgSrc] = useState(initialBanner);

    useEffect(() => {
        setImgSrc(targetCourse?.bannerImageUrl || DEFAULT_BANNER);
    }, [targetCourse?.bannerImageUrl]);

    return (
        <div className="shadow rounded-xl">
            <Image
                src={imgSrc}
                alt={courseName}
                width={400}
                height={300}
                unoptimized
                onError={() => setImgSrc(DEFAULT_BANNER)}
                className="w-full aspect-video rounded-t-xl object-cover"
            />
            <div className="p-3 flex-col gap-3">
                <h2 className="font-bold text-lg">{courseName}</h2>
                <p className="line-clamp-3 text-gray-400 text-sm">{courseDescription}</p>
                {/* <div className="flex justify-between items-center p-3">
                    {noOfChapters && (
                        <h2 className="flex items-center text-sm gap-2">
                            <Book className="text-primary h-5 w-5" />{noOfChapters} Chapters
                        </h2>
                    )}
                </div> */}
            </div>
        </div>
    );
}

export default EnrollCourseCard;