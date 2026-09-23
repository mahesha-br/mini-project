"use client"
import { Book, Clock, TrendingUp, Loader2, PlayCircle } from "lucide-react";
import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

function CourseInfo({ course, refreshData, ViewCourse }) {
    const courseLayout = course?.courseJson?.course;
    const courseName = courseLayout?.name || course?.name || 'Untitled Course';
    const description = courseLayout?.description || course?.description || '';
    const noOfChapters = courseLayout?.noOfChapters || course?.noOfChapters || courseLayout?.chapters?.length || 1;
    const level = courseLayout?.level || course?.level || 'Beginner';
    const bannerImageUrl = course?.bannerImageUrl || course?.courseJson?.bannerImageUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1600&h=900&auto=format&fit=crop&q=80';

    const [loadingContent, setLoadingContent] = useState(false);

    const router = useRouter();

    const GenerateCourseContent = async () => {
        setLoadingContent(true);
        try {
            const res = await axios.post('/api/generate-course-content', {
                course: course,
                courseTitle: courseName,
                courseId: course?.cid
            });
            console.log("Generated course content:", res.data);
            if (refreshData) {
                refreshData();
            }
            router.replace('/workspace');
            toast.success("Course Generated sucessfully");
        } catch (error) {
            console.error(error);
            setLoadingContent(false);
            toast.error("Server Side error,Try Again!");

        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center p-5 border rounded-xl shadow-sm bg-card w-full">
            <div className="flex flex-col gap-3 flex-1 w-full">
                <h2 className="font-bold text-2xl md:text-3xl tracking-tight">{courseName}</h2>
                <p className="line-clamp-3 text-gray-500 text-sm md:text-base leading-relaxed">
                    {description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2 w-full">
                    <div className="flex gap-3 items-center rounded-xl border p-3 shadow-2xs bg-background">
                        <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-500 shrink-0">
                            <Clock className="h-5 w-5" />
                        </div>
                        <section className="min-w-0">
                            <h3 className="text-[11px] text-gray-400 font-medium uppercase tracking-wider truncate">Duration</h3>
                            <p className="font-semibold text-base truncate">{noOfChapters * 2} Hours</p>
                        </section>
                    </div>

                    <div className="flex gap-3 items-center rounded-xl border p-3 shadow-2xs bg-background">
                        <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-500 shrink-0">
                            <Book className="h-5 w-5" />
                        </div>
                        <section className="min-w-0">
                            <h3 className="text-[11px] text-gray-400 font-medium uppercase tracking-wider truncate">Chapters</h3>
                            <p className="font-semibold text-base truncate">{noOfChapters} {noOfChapters === 1 ? 'Chapter' : 'Chapters'}</p>
                        </section>
                    </div>

                    <div className="flex gap-3 items-center rounded-xl border p-3 shadow-2xs bg-background">
                        <div className="p-2.5 rounded-lg bg-red-500/10 text-red-500 shrink-0">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <section className="min-w-0">
                            <h3 className="text-[11px] text-gray-400 font-medium uppercase tracking-wider truncate">Difficulty</h3>
                            <p className="font-semibold text-base capitalize truncate">{level}</p>
                        </section>
                    </div>
                </div>

                {!ViewCourse ?
                    <Button onClick={GenerateCourseContent} disabled={loadingContent}>
                        {loadingContent ? (
                            <span className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Generating content...
                            </span>
                        ) : (
                            "Generate content"
                        )}
                    </Button>
                    : <Link href={'/course/' + course?.cid}> <Button> <PlayCircle />Continue Learning</Button></Link>}
            </div>

            <div className="relative w-full md:w-[300px] lg:w-[380px] xl:w-[420px] h-[200px] sm:h-[240px] md:h-[260px] lg:h-[280px] shrink-0 rounded-xl overflow-hidden shadow-md border self-center md:self-stretch">
                <Image
                    src={bannerImageUrl}
                    alt={courseName}
                    fill
                    unoptimized
                    className="object-cover w-full h-full transform hover:scale-105 transition-transform duration-700 ease-out"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
            </div>
        </div>
    );
}

export default CourseInfo;