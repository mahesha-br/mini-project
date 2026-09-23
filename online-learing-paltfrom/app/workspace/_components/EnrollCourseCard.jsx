import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Book, PlayCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const DEFAULT_BANNER = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80";

function EnrollCourseCard({ course, enrollCourse }) {
    const targetCourse = course?.courses || course?.course || course;
    const courseJson = targetCourse?.courseJson?.course || targetCourse?.courseJson;
    const courseName = courseJson?.name || targetCourse?.name || "Untitled Course";
    const courseDescription = courseJson?.description || targetCourse?.description || "";
    const noOfChapters = courseJson?.noOfChapters || targetCourse?.noOfChapters;

    const initialBanner = targetCourse?.bannerImageUrl || DEFAULT_BANNER;
    const [imgSrc, setImgSrc] = useState(initialBanner);

    const calculateProgress = () => {
        return (enrollCourse?.completedChapters?.length ?? 0 / course?.courseContent?.length) * 100;

    }

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
                <h2 className="flex justify-between text-sm mt-3 text-primary">Progress <span>{calculateProgress()}%</span></h2>
                <Progress value={calculateProgress()} className="mt-3" />


                <Link href={'/workspace/couse/' + course?.cid}>
                    <Button className={'w-full mt-3'}><PlayCircle /> Continue Learning</Button></Link>
            </div>
        </div>
    );
}

export default EnrollCourseCard;