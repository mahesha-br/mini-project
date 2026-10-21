"use client";
import React, { useEffect, useState } from "react";
import axios from "axios";
import { useUser } from "@clerk/nextjs";
import { Award, BookOpen, CheckCircle, CheckCircle2, Clock, ExternalLink, GraduationCap, HelpCircle, Lock, PlayCircle, Sparkles, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import Image from "next/image";
import CertificateModal from "@/components/certificate/CertificateModal";
import CertificateEligibilityModal from "@/components/certificate/CertificateEligibilityModal";
import { formatCertificateDate, generateCertificateId } from "@/components/certificate/CertificateView";
import {
    evaluateCertificateEligibility,
    extractAllTopics,
    MIN_VIDEO_WATCH_PERCENTAGE,
    MIN_VIDEO_WATCH_SECONDS
} from "@/lib/certificateEligibility";
import { toast } from "sonner";

const DEFAULT_BANNER = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80";

export default function CertificatesPage() {
    const { user } = useUser();
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCourseForModal, setSelectedCourseForModal] = useState(null);
    const [selectedCourseForChecklist, setSelectedCourseForChecklist] = useState(null);
    const [completingDemoCourseId, setCompletingDemoCourseId] = useState(null);

    const recipientName = user?.fullName || user?.firstName || user?.username || "Student Name";

    const fetchEnrolledCourses = async () => {
        try {
            const res = await axios.get('/api/enroll-course');
            setEnrolledCourses(res.data || []);
        } catch (error) {
            console.error("Error fetching enrolled courses:", error);
            setEnrolledCourses([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;
        axios.get('/api/enroll-course')
            .then((res) => {
                if (isMounted) {
                    setEnrolledCourses(res.data || []);
                    setLoading(false);
                }
            })
            .catch((error) => {
                console.error("Error fetching enrolled courses:", error);
                if (isMounted) {
                    setEnrolledCourses([]);
                    setLoading(false);
                }
            });
        return () => {
            isMounted = false;
        };
    }, []);

    // Fast-complete helper for testing / demonstration of 100% completion & all criteria
    const handleFastComplete = async (item) => {
        const course = item?.courses || item?.course || item;
        const cid = course?.cid;
        const total = course?.courseContent?.length || course?.noOfChapters || course?.courseJson?.course?.chapters?.length || 1;
        const allChapters = Array.from({ length: total }, (_, i) => i);
        const mockQuizScores = {};
        const mockChapterVideos = {};
        const mockPercentages = {};
        const mockWatched = {};
        const mockDurations = {};

        for (let i = 0; i < total; i++) {
            const chKey = `chapter_${i}`;
            mockQuizScores[chKey] = {
                score: 3,
                total: 3,
                percentage: 100,
                passed: true,
                completedAt: new Date().toISOString()
            };
            mockChapterVideos[chKey] = {
                videoId: `demo_video_${i}`,
                watchedSeconds: 100,
                duration: 100,
                percentage: 100,
                isCompleted: true,
            };
            mockPercentages[`demo_video_${i}`] = 100;
            mockWatched[`demo_video_${i}`] = 100;
            mockDurations[`demo_video_${i}`] = 100;
        }

        const demoVideoProgress = {
            watchedSeconds: mockWatched,
            durations: mockDurations,
            percentages: mockPercentages,
            chapterVideos: mockChapterVideos,
            videoRequirementMet: true,
        };

        setCompletingDemoCourseId(cid);
        try {
            await axios.put('/api/enroll-course', {
                courseId: cid,
                completedChapters: allChapters,
                videoProgress: demoVideoProgress,
                quizScores: mockQuizScores,
            });
            toast.success("🎉 All criteria met (70%+ video per chapter, quizzes 100%). Certificate unlocked!");
            await fetchEnrolledCourses();
        } catch (err) {
            console.error("Error completing course:", err);
            toast.error("Could not update progress. Please try again.");
        } finally {
            setCompletingDemoCourseId(null);
        }
    };

    // Calculate completion metrics using unified eligibility helper
    const categorizedCourses = enrolledCourses.map((item) => {
        const course = item?.courses || item?.course || item;
        const enrollCourse = item?.enrollCourse;
        const eligibility = evaluateCertificateEligibility(course, enrollCourse);

        return {
            ...item,
            course,
            enrollCourse,
            eligibility,
            isCompleted: eligibility.isEligible
        };
    });

    const completedCourses = categorizedCourses.filter(c => c.isCompleted);
    const inProgressCourses = categorizedCourses.filter(c => !c.isCompleted);

    return (
        <div className="p-5 md:p-8 max-w-7xl mx-auto space-y-8">
            {/* Header Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gray-700 text-white p-6 md:p-8 shadow-lg border border-gray-600">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-gray-200 text-xs font-semibold tracking-wider uppercase">
                            <GraduationCap className="w-4 h-4 text-amber-400" />
                            Official Credentials
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                            Certificates of Completion
                        </h1>
                        <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                            To unlock an official certificate, complete all chapters, watch at least 70% of each chapter's video, and score at least 75% across all topic quizzes.
                        </p>
                    </div>

                    {/* Stats Counter */}
                    <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15 shrink-0">
                        <div className="p-3 rounded-lg bg-amber-500/20 text-amber-300">
                            <Award className="w-8 h-8" />
                        </div>
                        <div>
                            <span className="text-3xl font-black text-white">{completedCourses.length}</span>
                            <p className="text-xs text-gray-400 font-medium">Earned Certificates</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 1: Earned Certificates (All 4 Criteria Met) */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                            <CheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold tracking-tight">Earned Certificates</h2>
                            <p className="text-xs md:text-sm text-muted-foreground">Courses where you achieved all certificate requirements (min 75% score & 70% video watched per chapter)</p>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((n) => (
                            <div key={n} className="h-64 rounded-xl border bg-card animate-pulse p-4 flex flex-col justify-between" />
                        ))}
                    </div>
                ) : completedCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {completedCourses.map((item, idx) => {
                            const course = item.course;
                            const courseName = course?.courseJson?.course?.name || course?.name || "Untitled Course";
                            const certId = generateCertificateId(course?.cid, recipientName);
                            const overallScore = item.eligibility.overallScore;

                            return (
                                <div
                                    key={idx}
                                    className="group relative flex flex-col justify-between rounded-xl border bg-card p-5 shadow-xs hover:shadow-md transition-all duration-300 border-emerald-500/30 hover:border-emerald-500"
                                >
                                    {/* Gold Certificate Badge */}
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                                            <Award className="w-3.5 h-3.5 text-amber-500" />
                                            <span>Score: {overallScore}% (Passed)</span>
                                        </div>
                                        <span className="text-[11px] font-mono text-muted-foreground">{certId}</span>
                                    </div>

                                    {/* Course Details */}
                                    <div className="space-y-2 mb-4">
                                        <h3 className="font-bold text-lg text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                                            {courseName}
                                        </h3>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {course?.description || "Comprehensive mastery of all course topics and practical modules."}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                                            <Clock className="w-3.5 h-3.5" />
                                            <span>Issued: {formatCertificateDate(new Date())}</span>
                                        </div>
                                    </div>

                                    {/* Mini Certificate Preview Thumbnail */}
                                    <div
                                        onClick={() => setSelectedCourseForModal(item)}
                                        className="relative w-full aspect-[1.414/1] bg-slate-50 border rounded-lg overflow-hidden cursor-pointer shadow-inner mb-4 flex flex-col items-center justify-center p-3 text-center border-dashed border-blue-300/80 hover:bg-blue-50/50 transition-colors"
                                    >
                                        <Award className="w-8 h-8 text-amber-500 mb-1" />
                                        <span className="font-bold text-xs text-[#0F2942]">Certificate of Completion</span>
                                        <span className="text-[10px] text-blue-600 font-script text-base">{recipientName}</span>
                                        <span className="text-[9px] text-muted-foreground truncate max-w-[200px]">{courseName}</span>
                                        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 flex items-center justify-center transition-colors">
                                            <span className="opacity-0 group-hover:opacity-100 bg-white/90 text-slate-800 text-xs font-semibold px-3 py-1 rounded-full shadow-xs transition-opacity flex items-center gap-1.5">
                                                <ExternalLink className="w-3 h-3" /> Preview
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 pt-2 border-t">
                                        <Button
                                            onClick={() => setSelectedCourseForModal(item)}
                                            className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5 cursor-pointer"
                                        >
                                            <Award className="w-3.5 h-3.5" />
                                            <span>View Certificate</span>
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="rounded-xl border border-dashed p-8 text-center bg-card/50">
                        <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center mx-auto mb-3">
                            <Award className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-base mb-1">No Certificates Earned Yet</h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
                            Complete all chapters, watch at least 70% of each chapter's video, and score at least 75% on all chapter quizzes to unlock your certificate.
                        </p>
                    </div>
                )}
            </div>

            {/* Section 2: In-Progress Courses */}
            <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold tracking-tight">Courses In Progress</h2>
                            <p className="text-xs md:text-sm text-muted-foreground">Complete remaining criteria to unlock your official certificate</p>
                        </div>
                    </div>
                </div>

                {inProgressCourses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {inProgressCourses.map((item, idx) => {
                            const course = item.course;
                            const courseName = course?.courseJson?.course?.name || course?.name || "Untitled Course";
                            const banner = course?.bannerImageUrl || DEFAULT_BANNER;
                            const eligibility = item.eligibility;

                            return (
                                <div
                                    key={idx}
                                    className="rounded-xl border bg-card p-4 shadow-xs flex flex-col justify-between space-y-3"
                                >
                                    <div className="space-y-3">
                                        <div className="relative aspect-video rounded-lg overflow-hidden border">
                                            <Image
                                                src={banner}
                                                alt={courseName}
                                                fill
                                                unoptimized
                                                className="object-cover"
                                            />
                                            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-bold">
                                                {eligibility.checklist.filter(c => c.isCompleted).length}/4 Criteria
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-bold text-base line-clamp-1">{courseName}</h3>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {eligibility.chaptersCompletedCount} of {eligibility.totalChapters} chapters completed
                                            </p>
                                        </div>

                                        {/* Criteria Mini Pills */}
                                        <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                                            <div className={`p-1.5 rounded-md border flex items-center gap-1.5 ${eligibility.isChaptersCompleted ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20" : "bg-muted text-muted-foreground"}`}>
                                                {eligibility.isChaptersCompleted ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3" />}
                                                <span>Chapters: {eligibility.chaptersCompletedCount}/{eligibility.totalChapters}</span>
                                            </div>

                                            <div className={`p-1.5 rounded-md border flex items-center gap-1.5 ${eligibility.isVideoRequirementMet ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20" : "bg-muted text-muted-foreground"}`}>
                                                {eligibility.isVideoRequirementMet ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Video className="w-3 h-3" />}
                                                <span>Video: {eligibility.isVideoRequirementMet ? "70% ✓" : `${eligibility.videoChaptersCompletedCount}/${eligibility.totalChaptersWithVideos} Ch (70%)`}</span>
                                            </div>

                                            <div className={`p-1.5 rounded-md border flex items-center gap-1.5 ${eligibility.isAllChaptersAttended ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20" : "bg-muted text-muted-foreground"}`}>
                                                {eligibility.isAllChaptersAttended ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <HelpCircle className="w-3 h-3" />}
                                                <span>Quizzes: {eligibility.attendedChaptersCount}/{eligibility.totalChapters}</span>
                                            </div>

                                            <div className={`p-1.5 rounded-md border flex items-center gap-1.5 ${eligibility.isScorePassed ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20" : "bg-muted text-muted-foreground"}`}>
                                                {eligibility.isScorePassed ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Award className="w-3 h-3" />}
                                                <span>Score: {eligibility.overallScore}% / 75%</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action links */}
                                    <div className="pt-2 border-t flex flex-col gap-2">
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedCourseForChecklist(item)}
                                                className="flex-1 text-xs gap-1"
                                            >
                                                <Lock className="w-3 h-3" /> Requirements
                                            </Button>
                                            <Link href={`/course/${course?.cid}`} className="flex-1">
                                                <Button variant="default" size="sm" className="w-full gap-1 text-xs cursor-pointer">
                                                    <PlayCircle className="w-3 h-3" /> Continue
                                                </Button>
                                            </Link>
                                        </div>

                                        {/* Quick Test Demo Button */}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={completingDemoCourseId === course?.cid}
                                            onClick={() => handleFastComplete(item)}
                                            className="w-full text-[11px] text-muted-foreground hover:text-foreground h-7"
                                        >
                                            <Sparkles className="w-3 h-3 mr-1 text-amber-500" />
                                            {completingDemoCourseId === course?.cid ? "Completing..." : "Pass All (Instant Demo)"}
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : enrolledCourses.length === 0 && !loading ? (
                    <div className="rounded-xl border p-8 text-center bg-card">
                        <p className="text-muted-foreground text-sm mb-4">
                            You are not enrolled in any courses yet. Explore courses to begin your learning journey!
                        </p>
                        <Link href="/workspace/explore">
                            <Button className="cursor-pointer">Explore Courses</Button>
                        </Link>
                    </div>
                ) : null}
            </div>

            {/* Checklist Modal */}
            {selectedCourseForChecklist && (
                <CertificateEligibilityModal
                    isOpen={!!selectedCourseForChecklist}
                    onClose={() => setSelectedCourseForChecklist(null)}
                    eligibility={selectedCourseForChecklist.eligibility}
                    courseTitle={selectedCourseForChecklist.course?.name}
                    onOpenCertificate={() => {
                        setSelectedCourseForModal(selectedCourseForChecklist);
                        setSelectedCourseForChecklist(null);
                    }}
                    onFastCompleteDemo={() => {
                        handleFastComplete(selectedCourseForChecklist);
                        setSelectedCourseForChecklist(null);
                    }}
                />
            )}

            {/* Certificate Modal Preview */}
            {selectedCourseForModal && (
                <CertificateModal
                    isOpen={!!selectedCourseForModal}
                    onClose={() => setSelectedCourseForModal(null)}
                    course={selectedCourseForModal}
                    recipientName={recipientName}
                    completionDate={new Date()}
                />
            )}
        </div>
    );
}
