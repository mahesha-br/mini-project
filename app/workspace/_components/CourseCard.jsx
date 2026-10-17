"use client";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { Book, LoaderCircle, PlayCircle, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { toast } from "sonner";

const DEFAULT_BANNER = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80";

function CourseCard({ course }) {
    const courseJson = course?.courseJson?.course;
    const initialBanner = course?.bannerImageUrl || DEFAULT_BANNER;
    const [imgSrc, setImgSrc] = useState(initialBanner);
    const [loading, setLoading] = useState(false)

    const onEnrollCourse = async () => {
        try {
            setLoading(true);
            const result = await axios.post('/api/enroll-course', { courseId: course?.cid });
            console.log(result.data);
            if (result.data?.resp === 'Already Enrolled') {
                toast.warning('Already Enrolled');
                setLoading(false);
                return;
            }
            toast.success('Enrolled')
            setLoading(false);
        }
        catch (err) {
            toast.error('server side error')
            setLoading(false);

        }
    }

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
                <p className="line-clamp-3 text-gray-400 text-sm">{courseJson?.description}</p>
                <div className="flex justify-between items-center p-3">
                    <h2 className="flex items-center text-sm gap-2"><Book className="text-primary h-5 w-5" />{courseJson?.noOfChapters} Chapters</h2>
                    {course?.courseContent?.length ? (
                        <Button size={'sm'} onClick={onEnrollCourse}
                            disabled={loading}>
                            {loading ? <LoaderCircle className="animate-spin" /> : <PlayCircle />}Start Learning
                        </Button>
                    ) : (
                        <Link href={'/workspace/edit-course/' + course?.cid}>
                            <Button size={'sm'} variant={'outline'}><Settings />Generate Course</Button>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CourseCard;