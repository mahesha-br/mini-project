import { Button } from "@/components/ui/button";
import { Book, PlayCircle } from "lucide-react";
import Image from "next/image";
import React, { useState, useEffect } from "react";

const DEFAULT_BANNER = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80";

function CourseCard({ course }) {
    const courseJson = course?.courseJson?.course;
    const initialBanner = course?.bannerImageUrl || DEFAULT_BANNER;
    const [imgSrc, setImgSrc] = useState(initialBanner);

    useEffect(() => {
        setImgSrc(course?.bannerImageUrl || DEFAULT_BANNER);
    }, [course?.bannerImageUrl]);

    return (
        <div className="shadow rounded-xl">
            <Image
                src={imgSrc}
                alt={courseJson?.name || course?.name || "Course banner"}
                width={400}
                height={300}
                unoptimized
                onError={() => setImgSrc(DEFAULT_BANNER)}
                className="w-full aspect-video rounded-t-xl object-cover"
            />
            <div className="p-3 flex-col gap-3">
                <h2 className="font-bold text-lg">{courseJson?.name}</h2>
                <p className="line-clamp-3 text-gray-400 text-sm">{courseJson.description}</p>
                <div className="flex justify-between items-center">
                    <h2 className="flex items-center text-sm gap-2"><Book className="text-primary h-5 w-5" />{courseJson?.noOfChapters} Chapters</h2>
                    <Button size={'sm'}><PlayCircle />Start Learing</Button>
                </div>
            </div>
        </div>
    );
}

export default CourseCard;