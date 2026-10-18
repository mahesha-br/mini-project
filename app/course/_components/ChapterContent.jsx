"use client";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { SelectedChapterIndexContent } from "@/context/SelectedChapterIndexContent";
import axios from "axios";
import {
    Award,
    CheckCircle,
    CheckCircle2,
    Clock,
    HelpCircle,
    Loader2,
    Lock,
    PlayCircle,
    Sparkles,
    Video
} from "lucide-react";
import { useParams } from "next/navigation";
import YouTube from 'react-youtube';
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import CertificateModal from "@/components/certificate/CertificateModal";
import CertificateEligibilityModal from "@/components/certificate/CertificateEligibilityModal";
import ChapterQuiz from "@/components/quiz/ChapterQuiz";
import {
    evaluateCertificateEligibility,
    MIN_PASSING_PERCENTAGE,
    MIN_VIDEO_WATCH_SECONDS
} from "@/lib/certificateEligibility";
import { Progress } from "@/components/ui/progress";

function ChapterContent({ courseInfo, refreshData }) {
    const { user } = useUser();
    const { courseId } = useParams();
    const [markingComplete, setMarkingComplete] = useState(false);
    const [showCertModal, setShowCertModal] = useState(false);
    const [showEligibilityModal, setShowEligibilityModal] = useState(false);

    const course = courseInfo?.courses;
    const enrollCourse = courseInfo?.enrollCourse;
    const courseContent = course?.courseContent;
    const chapters = course?.courseJson?.course?.chapters;
    const { selectedChapterIndex } = useContext(SelectedChapterIndexContent);

    const currentContent = courseContent?.[selectedChapterIndex];
    const currentChapter = chapters?.[selectedChapterIndex];

    const videoData = currentContent?.youtubeVideo || currentChapter?.youtubeVideo;
    const topics = currentContent?.content?.topics || currentContent?.courseData?.topics || currentContent?.topics || currentChapter?.topics;
    const chapterName = currentContent?.content?.chapterName || currentContent?.chapterName || currentChapter?.chapterName || currentChapter?.title;
    const courseTitle = course?.courseJson?.course?.name || course?.name || "Online Course";

    const totalChapters = courseContent?.length || chapters?.length || course?.noOfChapters || 1;
    const completedList = (enrollCourse?.completedChapters || enrollCourse?.completedChapter || []);
    const recipientName = user?.fullName || user?.firstName || user?.username || "Student Name";

    // Video watch tracking state
    const [videoWatchSeconds, setVideoWatchSeconds] = useState(() => {
        return enrollCourse?.videoProgress?.watchedSeconds || {};
    });
    const intervalRef = useRef({});
    const lastSavedSecondsRef = useRef({});

    // Quiz scores state (keyed by chapter, e.g. chapter_0, chapter_1)
    const [quizScores, setQuizScores] = useState(() => {
        return enrollCourse?.quizScores || {};
    });

    // Synchronize local states when courseInfo updates
    useEffect(() => {
        if (enrollCourse?.videoProgress?.watchedSeconds) {
            setVideoWatchSeconds((prev) => ({
                ...prev,
                ...enrollCourse.videoProgress.watchedSeconds,
            }));
        }
        if (enrollCourse?.quizScores) {
            setQuizScores(enrollCourse.quizScores);
        }
    }, [enrollCourse]);

    // Clean up all video timers on unmount
    useEffect(() => {
        return () => {
            Object.values(intervalRef.current).forEach(clearInterval);
        };
    }, []);

    // Evaluate certificate eligibility
    const mergedEnrollCourse = {
        ...enrollCourse,
        videoProgress: {
            ...(enrollCourse?.videoProgress || {}),
            watchedSeconds: videoWatchSeconds,
            maxWatchedSeconds: Math.max(
                0,
                ...Object.values(videoWatchSeconds).filter(v => typeof v === 'number'),
                enrollCourse?.videoProgress?.maxWatchedSeconds || 0
            ),
            videoRequirementMet: Math.max(
                0,
                ...Object.values(videoWatchSeconds).filter(v => typeof v === 'number'),
                enrollCourse?.videoProgress?.maxWatchedSeconds || 0
            ) >= MIN_VIDEO_WATCH_SECONDS
        },
        quizScores: quizScores,
    };

    const eligibility = evaluateCertificateEligibility(course, mergedEnrollCourse);

    // Save video progress to backend
    const saveVideoProgressToBackend = async (vId, seconds) => {
        const updatedWatched = {
            ...videoWatchSeconds,
            [vId]: seconds,
        };
        const maxSecs = Math.max(0, ...Object.values(updatedWatched).filter(v => typeof v === 'number'));
        const requirementMet = maxSecs >= MIN_VIDEO_WATCH_SECONDS;

        try {
            await axios.put('/api/enroll-course', {
                courseId: courseId,
                videoProgress: {
                    watchedSeconds: { [vId]: seconds },
                    maxWatchedSeconds: maxSecs,
                    videoRequirementMet: requirementMet,
                }
            });
        } catch (err) {
            console.error("Failed to save video progress:", err);
        }
    };

    // Video progress update handler
    const updateVideoProgress = (videoId, currentSecs, forceSave = false) => {
        setVideoWatchSeconds((prev) => {
            const previousSecs = prev[videoId] || 0;
            if (currentSecs <= previousSecs && !forceSave) return prev;

            const nextSecs = Math.max(previousSecs, currentSecs);

            // Notify student when 2-minute milestone is reached
            if (previousSecs < MIN_VIDEO_WATCH_SECONDS && nextSecs >= MIN_VIDEO_WATCH_SECONDS) {
                toast.success('🎉 2-Minute Video Requirement Completed! (Watched >= 2:00 mins)', {
                    duration: 5000,
                });
            }

            // Debounced save every 10 seconds or on forceSave (pause/end)
            const lastSaved = lastSavedSecondsRef.current[videoId] || 0;
            if (forceSave || nextSecs - lastSaved >= 10 || (previousSecs < MIN_VIDEO_WATCH_SECONDS && nextSecs >= MIN_VIDEO_WATCH_SECONDS)) {
                lastSavedSecondsRef.current[videoId] = nextSecs;
                saveVideoProgressToBackend(videoId, nextSecs);
            }

            return {
                ...prev,
                [videoId]: nextSecs,
            };
        });
    };

    // YouTube state changes
    const onPlayerStateChange = (videoId, event) => {
        if (!event?.target) return;

        // 1 = PLAYING
        if (event.data === 1) {
            if (intervalRef.current[videoId]) clearInterval(intervalRef.current[videoId]);
            intervalRef.current[videoId] = setInterval(() => {
                if (event.target && typeof event.target.getCurrentTime === 'function') {
                    const secs = Math.floor(event.target.getCurrentTime());
                    updateVideoProgress(videoId, secs, false);
                }
            }, 1000);
        } else {
            // PAUSED (2), ENDED (0), or BUFFERING
            if (intervalRef.current[videoId]) {
                clearInterval(intervalRef.current[videoId]);
                delete intervalRef.current[videoId];
            }
            if (typeof event.target.getCurrentTime === 'function') {
                const secs = Math.floor(event.target.getCurrentTime());
                updateVideoProgress(videoId, secs, true);
            }
        }
    };

    // Handle Quiz completion for a chapter
    const handleQuizCompleted = async (chapterKey, quizResult) => {
        const updatedScores = {
            ...quizScores,
            [chapterKey]: quizResult,
        };
        setQuizScores(updatedScores);

        try {
            await axios.put('/api/enroll-course', {
                courseId: courseId,
                quizScores: {
                    [chapterKey]: quizResult,
                }
            });

            // Re-evaluate eligibility with updated scores
            const newEligibility = evaluateCertificateEligibility(course, {
                ...mergedEnrollCourse,
                quizScores: updatedScores,
            });

            if (newEligibility.isEligible) {
                toast.success(`🎉 Outstanding! All requirements met with combined score of ${newEligibility.overallScore}%! Certificate unlocked!`, {
                    action: {
                        label: 'View Certificate',
                        onClick: () => setShowCertModal(true)
                    },
                    duration: 10000
                });
            } else if (quizResult.passed) {
                toast.success(`Chapter Quiz passed with ${quizResult.percentage}%! (Combined score: ${newEligibility.overallScore}%, Min 75% needed)`);
            } else {
                toast.info(`Chapter Quiz completed (${quizResult.percentage}%). Combined minimum 75% across all chapters required.`);
            }

            if (refreshData) refreshData();
        } catch (error) {
            console.error("Failed to save chapter quiz score:", error);
            toast.error("Could not save quiz score. Please try again.");
        }
    };

    // Mark chapter completed
    const markChapterCompleted = async () => {
        let completedChapters = Array.isArray(enrollCourse?.completedChapters)
            ? [...enrollCourse.completedChapters]
            : (Array.isArray(enrollCourse?.completedChapter) ? [...enrollCourse.completedChapter] : []);

        if (!completedChapters.includes(selectedChapterIndex)) {
            completedChapters.push(selectedChapterIndex);
            setMarkingComplete(true);
            try {
                await axios.put('/api/enroll-course', {
                    courseId: courseId,
                    completedChapters: completedChapters
                });

                if (refreshData) refreshData();

                const newEligibility = evaluateCertificateEligibility(course, {
                    ...mergedEnrollCourse,
                    completedChapters,
                });

                if (newEligibility.isEligible) {
                    toast.success('🎉 Congratulations! You have satisfied all certificate criteria! Your Certificate is ready!', {
                        action: {
                            label: 'View Certificate',
                            onClick: () => setShowCertModal(true)
                        },
                        duration: 8000
                    });
                    setShowCertModal(true);
                } else {
                    toast.success('Chapter Marked as Completed!');
                }
            } catch (error) {
                console.error("Error marking chapter complete:", error);
                toast.error('Could not update progress. Try again.');
            } finally {
                setMarkingComplete(false);
            }
        } else {
            toast.info('Chapter already marked as completed!');
        }
    };

    // Quick demo complete to test certificate unlock
    const handleFastCompleteDemo = async () => {
        const allChapters = Array.from({ length: totalChapters }, (_, i) => i);
        const mockQuizScores = {};
        for (let i = 0; i < totalChapters; i++) {
            mockQuizScores[`chapter_${i}`] = {
                score: 3,
                total: 3,
                percentage: 100,
                passed: true,
                completedAt: new Date().toISOString()
            };
        }

        const demoVideoProgress = {
            watchedSeconds: { demo_video: MIN_VIDEO_WATCH_SECONDS },
            maxWatchedSeconds: MIN_VIDEO_WATCH_SECONDS,
            videoRequirementMet: true,
        };

        try {
            await axios.put('/api/enroll-course', {
                courseId: courseId,
                completedChapters: allChapters,
                videoProgress: demoVideoProgress,
                quizScores: mockQuizScores,
            });

            setVideoWatchSeconds(demoVideoProgress.watchedSeconds);
            setQuizScores(mockQuizScores);

            if (refreshData) refreshData();

            setShowEligibilityModal(false);
            setShowCertModal(true);
            toast.success("🎉 Demo Complete! All 4 criteria satisfied (100% combined score). Certificate unlocked!");
        } catch (err) {
            console.error("Fast complete demo failed:", err);
            toast.error("Fast complete failed. Try again.");
        }
    };

    const isCompleted = completedList?.includes(selectedChapterIndex);

    return (
        <div className="p-6 md:p-10 space-y-6">
            {/* Top Certificate Status Banner */}
            <div className={`rounded-xl border p-4.5 transition-all shadow-xs ${eligibility.isEligible
                ? "bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-blue-500/15 border-amber-500/40"
                : "bg-card border-border"
                }`}>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-full ${eligibility.isEligible ? "bg-amber-500 text-white shadow-md" : "bg-muted text-muted-foreground"
                            }`}>
                            {eligibility.isEligible ? <Award className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-base flex items-center gap-1.5">
                                    <span>
                                        {eligibility.isEligible
                                            ? "🎉 Certificate of Completion Unlocked!"
                                            : "Certificate Eligibility Progress"
                                        }
                                    </span>
                                    {eligibility.isEligible && <Sparkles className="w-4 h-4 text-amber-500" />}
                                </h3>
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${eligibility.isEligible
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                    : "bg-muted text-muted-foreground"
                                    }`}>
                                    {eligibility.isEligible
                                        ? `Combined Score: ${eligibility.overallScore}% (Passed)`
                                        : `${eligibility.checklist.filter(c => c.isCompleted).length}/4 Requirements Met`
                                    }
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {eligibility.isEligible
                                    ? `Congratulations! You watched >= 2 min video and scored ${eligibility.overallScore}% combined across all chapters (>= 75% required).`
                                    : "Watch at least 1 video for 2 minutes and score min 75% combined across all chapter quizzes to earn your certificate."
                                }
                            </p>

                            {/* 4 Quick Badges */}
                            <div className="flex flex-wrap gap-2 mt-2.5 text-[11px]">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border ${eligibility.isChaptersCompleted
                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 font-medium"
                                    : "bg-muted text-muted-foreground border-border"
                                    }`}>
                                    {eligibility.isChaptersCompleted ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3" />}
                                    Chapters: {eligibility.chaptersCompletedCount}/{eligibility.totalChapters}
                                </span>

                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border ${eligibility.isVideoRequirementMet
                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 font-medium"
                                    : "bg-muted text-muted-foreground border-border"
                                    }`}>
                                    {eligibility.isVideoRequirementMet ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Video className="w-3 h-3" />}
                                    Video: {eligibility.isVideoRequirementMet ? "2m Watched ✓" : `${Math.floor(eligibility.maxWatchedSeconds / 60)}m ${eligibility.maxWatchedSeconds % 60}s / 2m`}
                                </span>

                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border ${eligibility.isAllChaptersAttended
                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 font-medium"
                                    : "bg-muted text-muted-foreground border-border"
                                    }`}>
                                    {eligibility.isAllChaptersAttended ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <HelpCircle className="w-3 h-3" />}
                                    Quizzes: {eligibility.attendedChaptersCount}/{eligibility.totalChapters} Chapters
                                </span>

                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border ${eligibility.isScorePassed
                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20 font-medium"
                                    : "bg-muted text-muted-foreground border-border"
                                    }`}>
                                    {eligibility.isScorePassed ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Award className="w-3 h-3" />}
                                    Combined Score: {eligibility.overallScore}% (Min {MIN_PASSING_PERCENTAGE}%)
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowEligibilityModal(true)}
                            className="text-xs cursor-pointer flex-1 md:flex-initial"
                        >
                            View Checklist
                        </Button>
                        {eligibility.isEligible && (
                            <Button
                                onClick={() => setShowCertModal(true)}
                                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1.5 text-xs shrink-0 cursor-pointer flex-1 md:flex-initial"
                            >
                                <Award className="w-4 h-4" /> View My Certificate
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Chapter Header & Mark Completed Button */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <h2 className="font-bold text-2xl">{selectedChapterIndex + 1}. {chapterName}</h2>
                <Button onClick={() => markChapterCompleted()} disabled={isCompleted || markingComplete} className="shrink-0 cursor-pointer">
                    {markingComplete ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <CheckCircle />
                    )}
                    {isCompleted ? 'Completed' : markingComplete ? 'Saving...' : 'Mark as completed'}
                </Button>
            </div>

            {/* Related Videos with Live 2-Min Watch Tracking */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        Related Videos <PlayCircle className="w-5 h-5 text-primary" />
                    </h3>
                    <span className="text-xs text-muted-foreground">
                        {eligibility.isVideoRequirementMet ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> 2-min requirement met!
                            </span>
                        ) : (
                            <span>Watch at least 1 video for 2:00 mins</span>
                        )}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {videoData?.map((video, index) => {
                        if (index >= 4) return null;
                        const vId = video?.videoId || video?.id?.videoId;
                        const watched = videoWatchSeconds[vId] || 0;
                        const isMet = watched >= MIN_VIDEO_WATCH_SECONDS;
                        const progressPct = Math.min(100, Math.round((watched / MIN_VIDEO_WATCH_SECONDS) * 100));

                        return (
                            <div key={index} className="border rounded-xl bg-card overflow-hidden shadow-xs flex flex-col justify-between">
                                <div className="aspect-video w-full bg-black relative">
                                    <YouTube
                                        videoId={vId}
                                        opts={{
                                            height: '100%',
                                            width: '100%',
                                            playerVars: {
                                                autoplay: 0,
                                            }
                                        }}
                                        className="w-full h-full"
                                        onStateChange={(e) => onPlayerStateChange(vId, e)}
                                    />
                                </div>

                                {/* Video Watch Progress Footer */}
                                <div className="p-3 bg-muted/20 border-t space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-medium flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                            Watched: {Math.floor(watched / 60)}m {(watched % 60).toString().padStart(2, '0')}s / 2m 00s
                                        </span>
                                        {isMet ? (
                                            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                                <CheckCircle2 className="w-3 h-3" /> Requirement Met
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground text-[11px]">
                                                {MIN_VIDEO_WATCH_SECONDS - watched}s remaining
                                            </span>
                                        )}
                                    </div>
                                    <Progress value={progressPct} className="h-1.5" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Topics & Lesson Content */}
            <div className="mt-7 space-y-6">
                <div>
                    <h3 className="font-bold text-xl">Topics & Lesson Content</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Read through each topic in this chapter before taking the 3-question chapter quiz below.
                    </p>
                </div>

                {topics?.map((item, index) => {
                    const topicTitle = typeof item === 'string' ? item : (item?.topic || item?.topics || item?.topicName || item?.title);
                    const topicContent = typeof item === 'object' ? item?.content : null;

                    return (
                        <div key={index} className="bg-secondary/40 border rounded-2xl p-5 md:p-6 shadow-xs">
                            <h4 className="font-bold text-lg text-foreground mb-3">{topicTitle}</h4>

                            {topicContent && (
                                typeof topicContent === 'string' && topicContent.includes('<') ? (
                                    <div
                                        dangerouslySetInnerHTML={{ __html: topicContent }}
                                        style={{ lineHeight: '2.2' }}
                                        className="prose prose-sm dark:prose-invert max-w-none text-foreground/90"
                                    />
                                ) : (
                                    <p className="text-sm leading-relaxed text-foreground/90">{topicContent}</p>
                                )
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Chapter Assessment Quiz (3 Questions per Chapter) */}
            <div className="mt-10 pt-6 border-t">
                <div className="mb-4">
                    <h3 className="font-bold text-xl flex items-center gap-2">
                        <span>Chapter Assessment & Quiz</span>
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                            3 Questions
                        </span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Test your understanding of {chapterName}. Score at least 75% combined across all chapters to unlock your official certificate.
                    </p>
                </div>

                <ChapterQuiz
                    key={`chapter_quiz_${selectedChapterIndex}`}
                    chapterKey={`chapter_${selectedChapterIndex}`}
                    chapterIndex={selectedChapterIndex}
                    chapterName={chapterName}
                    courseTitle={courseTitle}
                    topics={topics}
                    existingScore={quizScores[`chapter_${selectedChapterIndex}`] || quizScores[`ch_${selectedChapterIndex}`]}
                    onQuizCompleted={handleQuizCompleted}
                />
            </div>

            {/* Certificate Requirements Checklist Modal */}
            {showEligibilityModal && (
                <CertificateEligibilityModal
                    isOpen={showEligibilityModal}
                    onClose={() => setShowEligibilityModal(false)}
                    eligibility={eligibility}
                    courseTitle={courseTitle}
                    onOpenCertificate={() => setShowCertModal(true)}
                    onFastCompleteDemo={handleFastCompleteDemo}
                />
            )}

            {/* Official Certificate Modal */}
            {showCertModal && (
                <CertificateModal
                    isOpen={showCertModal}
                    onClose={() => setShowCertModal(false)}
                    course={course}
                    recipientName={recipientName}
                    completionDate={new Date()}
                />
            )}
        </div>
    );
}

export default ChapterContent;