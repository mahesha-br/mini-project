"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Award, PlayCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import CertificateModal from "@/components/certificate/CertificateModal";

const DEFAULT_BANNER = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80";

function EnrollCourseCard({ course, enrollCourse }) {
    const { user } = useUser();
    const [showCertModal, setShowCertModal] = useState(false);
    const [imgError, setImgError] = useState(false);
    const targetCourse = course?.courses || course?.course || course;
    const courseJson = targetCourse?.courseJson?.course || targetCourse?.courseJson;
    const courseName = courseJson?.name || targetCourse?.name || "Untitled Course";
    const courseDescription = courseJson?.description || targetCourse?.description || "";
    const noOfChapters = courseJson?.noOfChapters || targetCourse?.noOfChapters;

    const banner = targetCourse?.bannerImageUrl || DEFAULT_BANNER;
    const imgSrc = imgError ? DEFAULT_BANNER : banner;

    const calculateProgress = () => {
        const completed = enrollCourse?.completedChapters?.length || 0;
        const total = targetCourse?.courseContent?.length || noOfChapters || 1;
        return Math.min(100, Math.round((completed / total) * 100));
    };

    const progress = calculateProgress();
    const isCompleted = progress >= 100;
    const recipientName = user?.fullName || user?.firstName || user?.username || "Student Name";

    return (
        <div className="shadow rounded-xl bg-card border overflow-hidden flex flex-col justify-between">
            <div>
                <div className="relative">
                    <Image
                        src={imgSrc}
                        alt={courseName}
                        width={400}
                        height={300}
                        unoptimized
                        onError={() => setImgError(true)}
                        className="w-full aspect-video rounded-t-xl object-cover"
                    />
                    {isCompleted && (
                        <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-emerald-600/90 text-white text-xs font-semibold flex items-center gap-1 shadow-md">
                            <Award className="w-3.5 h-3.5 text-amber-300" />
                            <span>Completed</span>
                        </div>
                    )}
                </div>
                <div className="p-4 flex flex-col gap-2">
                    <h2 className="font-bold text-lg line-clamp-1">{courseName}</h2>
                    <p className="line-clamp-2 text-muted-foreground text-sm">{courseDescription}</p>
                    
                    <div className="mt-2 space-y-1.5">
                        <div className="flex justify-between text-sm font-medium">
                            <span className="text-muted-foreground">Progress</span>
                            <span className={isCompleted ? "text-emerald-600 font-bold" : "text-primary"}>
                                {progress}%
                            </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>
                </div>
            </div>

            <div className="p-4 pt-0 flex flex-col gap-2">
                {isCompleted ? (
                    <div className="flex gap-2">
                        <Button
                            onClick={() => setShowCertModal(true)}
                            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white gap-1.5 cursor-pointer text-xs"
                        >
                            <Award className="w-4 h-4" /> View Certificate
                        </Button>
                        <Link href={'/workspace/view-course/' + (targetCourse?.cid || '')} className="flex-1">
                            <Button variant="outline" className="w-full text-xs">
                                Review Course
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <Link href={'/workspace/view-course/' + (targetCourse?.cid || '')}>
                        <Button className="w-full gap-2 cursor-pointer">
                            <PlayCircle className="w-4 h-4" /> Continue Learning
                        </Button>
                    </Link>
                )}
            </div>

            {showCertModal && (
                <CertificateModal
                    isOpen={showCertModal}
                    onClose={() => setShowCertModal(false)}
                    course={targetCourse}
                    recipientName={recipientName}
                    completionDate={new Date()}
                />
            )}
        </div>
    );
}

export default EnrollCourseCard;