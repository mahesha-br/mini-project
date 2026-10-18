"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Award, Lock, PlayCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import CertificateModal from "@/components/certificate/CertificateModal";
import CertificateEligibilityModal from "@/components/certificate/CertificateEligibilityModal";
import { evaluateCertificateEligibility } from "@/lib/certificateEligibility";

const DEFAULT_BANNER = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80";

function EnrollCourseCard({ course, enrollCourse }) {
    const { user } = useUser();
    const [showCertModal, setShowCertModal] = useState(false);
    const [showEligibilityModal, setShowEligibilityModal] = useState(false);
    const [imgError, setImgError] = useState(false);

    const targetCourse = course?.courses || course?.course || course;
    const courseJson = targetCourse?.courseJson?.course || targetCourse?.courseJson;
    const courseName = courseJson?.name || targetCourse?.name || "Untitled Course";
    const courseDescription = courseJson?.description || targetCourse?.description || "";
    const noOfChapters = courseJson?.noOfChapters || targetCourse?.noOfChapters;

    const banner = targetCourse?.bannerImageUrl || DEFAULT_BANNER;
    const imgSrc = imgError ? DEFAULT_BANNER : banner;

    const eligibility = evaluateCertificateEligibility(targetCourse, enrollCourse);
    const chaptersProgress = eligibility.checklist.find(c => c.id === 'chapters')?.progress || 0;
    const completedCriteriaCount = eligibility.checklist.filter(c => c.isCompleted).length;
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
                    {eligibility.isEligible ? (
                        <div className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-emerald-600/90 text-white text-xs font-semibold flex items-center gap-1 shadow-md">
                            <Award className="w-3.5 h-3.5 text-amber-300" />
                            <span>Certificate Ready ({eligibility.overallScore}%)</span>
                        </div>
                    ) : (
                        <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium flex items-center gap-1">
                            <Lock className="w-3 h-3 text-amber-400" />
                            <span>{completedCriteriaCount}/4 Criteria</span>
                        </div>
                    )}
                </div>
                <div className="p-4 flex flex-col gap-2">
                    <h2 className="font-bold text-lg line-clamp-1">{courseName}</h2>
                    <p className="line-clamp-2 text-muted-foreground text-sm">{courseDescription}</p>

                    <div className="mt-2 space-y-1.5">
                        <div className="flex justify-between text-sm font-medium">
                            <span className="text-muted-foreground">Chapter Progress</span>
                            <span className={eligibility.isChaptersCompleted ? "text-emerald-600 font-bold" : "text-primary"}>
                                {chaptersProgress}%
                            </span>
                        </div>
                        <Progress value={chaptersProgress} className="h-2" />
                    </div>

                    {/* Criteria Quick Status */}
                    <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t">
                        <span>Video &bull; {eligibility.isVideoRequirementMet ? "2m ✓" : `${Math.floor(eligibility.maxWatchedSeconds / 60)}m ${eligibility.maxWatchedSeconds % 60}s`}</span>
                        <span>Quizzes &bull; {eligibility.attendedChaptersCount}/{eligibility.totalChapters}</span>
                        <span>Combined &bull; {eligibility.overallScore}%</span>
                    </div>
                </div>
            </div>

            <div className="p-4 pt-0 flex flex-col gap-2">
                {eligibility.isEligible ? (
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
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowEligibilityModal(true)}
                            className="text-xs px-2.5 gap-1 shrink-0"
                        >
                            <Lock className="w-3.5 h-3.5 text-amber-500" /> Checklist
                        </Button>
                        <Link href={'/course/' + (targetCourse?.cid || '')} className="flex-1">
                            <Button className="w-full gap-2 cursor-pointer text-xs">
                                <PlayCircle className="w-4 h-4" /> Continue Learning
                            </Button>
                        </Link>
                    </div>
                )}
            </div>

            {/* Checklist Dialog */}
            {showEligibilityModal && (
                <CertificateEligibilityModal
                    isOpen={showEligibilityModal}
                    onClose={() => setShowEligibilityModal(false)}
                    eligibility={eligibility}
                    courseTitle={courseName}
                    onOpenCertificate={() => setShowCertModal(true)}
                />
            )}

            {/* Certificate Modal */}
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