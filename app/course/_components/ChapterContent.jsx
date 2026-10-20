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
    MIN_VIDEO_WATCH_SECONDS,
    MIN_VIDEO_WATCH_PERCENTAGE
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

    // Video watch tracking state (seconds, durations, percentages, per-chapter records)
    const [videoWatchSeconds, setVideoWatchSeconds] = useState(() => {
        return enrollCourse?.videoProgress?.watchedSeconds || {};
    });
    const [videoDurations, setVideoDurations] = useState(() => {
        return enrollCourse?.videoProgress?.durations || {};
    });
    const [videoPercentages, setVideoPercentages] = useState(() => {
        return enrollCourse?.videoProgress?.percentages || {};
    });
    const [chapterVideos, setChapterVideos] = useState(() => {
        return enrollCourse?.videoProgress?.chapterVideos || {};
    });

    const intervalRef = useRef({});
    const lastSavedSecondsRef = useRef({});

    // Quiz scores state (keyed by chapter, e.g. chapter_0, chapter_1)
    const [quizScores, setQuizScores] = useState(() => {
        return enrollCourse?.quizScores || {};
    });

    // Synchronize local states when courseInfo updates
    useEffect(() => {
        if (enrollCourse?.videoProgress) {
            if (enrollCourse.videoProgress.watchedSeconds) {
                setVideoWatchSeconds((prev) => ({
                    ...prev,
                    ...enrollCourse.videoProgress.watchedSeconds,
                }));
            }
            if (enrollCourse.videoProgress.durations) {
                setVideoDurations((prev) => ({
                    ...prev,
                    ...enrollCourse.videoProgress.durations,
                }));
            }
            if (enrollCourse.videoProgress.percentages) {
                setVideoPercentages((prev) => ({
                    ...prev,
                    ...enrollCourse.videoProgress.percentages,
                }));
            }
            if (enrollCourse.videoProgress.chapterVideos) {
                setChapterVideos((prev) => ({
                    ...prev,
                    ...enrollCourse.videoProgress.chapterVideos,
                }));
            }
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
            durations: videoDurations,
            percentages: videoPercentages,
            chapterVideos: chapterVideos,
        },
        quizScores: quizScores,
    };

    const eligibility = evaluateCertificateEligibility(course, mergedEnrollCourse);

    // Save video progress to backend
    const saveVideoProgressToBackend = async (vId, seconds, duration, pct) => {
        const chapterKey = `chapter_${selectedChapterIndex}`;
        const isMet = pct >= MIN_VIDEO_WATCH_PERCENTAGE;

        try {
            await axios.put('/api/enroll-course', {
                courseId: courseId,
                videoProgress: {
                    watchedSeconds: { [vId]: seconds },
                    durations: duration > 0 ? { [vId]: duration } : {},
                    percentages: { [vId]: pct },
                    chapterVideos: {
                        [chapterKey]: {
                            videoId: vId,
                            watchedSeconds: seconds,
                            duration: duration,
                            percentage: pct,
                            isCompleted: isMet,
                        }
                    }
                }
            });
        } catch (err) {
            console.error("Failed to save video progress:", err);
        }
    };

    // Video progress update handler
    const updateVideoProgress = (videoId, currentSecs, totalDuration, forceSave = false) => {
        const duration = totalDuration > 0 ? totalDuration : (videoDurations[videoId] || 0);
        const chapterKey = `chapter_${selectedChapterIndex}`;

        if (duration > 0 && (!videoDurations[videoId] || videoDurations[videoId] !== duration)) {
            setVideoDurations(prev => ({ ...prev, [videoId]: duration }));
        }

        setVideoWatchSeconds((prev) => {
            const previousSecs = prev[videoId] || 0;
            if (currentSecs <= previousSecs && !forceSave) return prev;

            const nextSecs = Math.max(previousSecs, currentSecs);
            const calculatedPct = duration > 0 ? Math.min(100, Math.round((nextSecs / duration) * 100)) : 0;
            const previousPct = videoPercentages[videoId] || 0;
            const nextPct = Math.max(previousPct, calculatedPct);

            const wasMet = previousPct >= MIN_VIDEO_WATCH_PERCENTAGE;
            const isMet = nextPct >= MIN_VIDEO_WATCH_PERCENTAGE;

            if (nextPct !== previousPct) {
                setVideoPercentages(p => ({ ...p, [videoId]: nextPct }));
                setChapterVideos(p => ({
                    ...p,
                    [chapterKey]: {
                        videoId,
                        watchedSeconds: nextSecs,
                        duration,
                        percentage: nextPct,
                        isCompleted: isMet,
                    }
                }));
            }

            // Notify student when 70% milestone is reached for this chapter video
            if (!wasMet && isMet) {
                toast.success(`🎉 Chapter Video Requirement Met! (${nextPct}% watched - >= 70% completed)`, {
                    duration: 5000,
                });
            }

            // Debounced save every 10 seconds, on milestone reached, or on forceSave (pause/end)
            const lastSaved = lastSavedSecondsRef.current[videoId] || 0;
            if (forceSave || (!wasMet && isMet) || (nextSecs - lastSaved >= 10)) {
                lastSavedSecondsRef.current[videoId] = nextSecs;
                saveVideoProgressToBackend(videoId, nextSecs, duration, nextPct);
            }

            return {
                ...prev,
                [videoId]: nextSecs,
            };
        });
    };

    // YouTube player ready
    const onPlayerReady = (videoId, event) => {
        if (event?.target && typeof event.target.getDuration === 'function') {
            const d = Math.floor(event.target.getDuration());
            if (d > 0) {
                setVideoDurations(prev => ({ ...prev, [videoId]: d }));
            }
        }
    };

    // YouTube state changes
    const onPlayerStateChange = (videoId, event) => {
        if (!event?.target) return;

        const getPlayerStats = () => {
            const current = typeof event.target.getCurrentTime === 'function'
                ? Math.floor(event.target.getCurrentTime())
                : 0;
            const duration = typeof event.target.getDuration === 'function'
                ? Math.floor(event.target.getDuration())
                : (videoDurations[videoId] || 0);
            return { current, duration };
        };

        // 1 = PLAYING
        if (event.data === 1) {
            if (intervalRef.current[videoId]) clearInterval(intervalRef.current[videoId]);
            intervalRef.current[videoId] = setInterval(() => {
                const { current, duration } = getPlayerStats();
                updateVideoProgress(videoId, current, duration, false);
            }, 1000);
        } else if (event.data === 0) {
            // ENDED -> 100% completed
            if (intervalRef.current[videoId]) {
                clearInterval(intervalRef.current[videoId]);
                delete intervalRef.current[videoId];
            }
            const { duration } = getPlayerStats();
            const total = duration > 0 ? duration : 100;
            updateVideoProgress(videoId, total, total, true);
        } else {
            // PAUSED (2), BUFFERING, etc.
            if (intervalRef.current[videoId]) {
                clearInterval(intervalRef.current[videoId]);
                delete intervalRef.current[videoId];
            }
            const { current, duration } = getPlayerStats();
            updateVideoProgress(videoId, current, duration, true);
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
        const allChaptersList = Array.from({ length: totalChapters }, (_, i) => i);
        const mockQuizScores = {};
        const mockChapterVideos = {};
        const mockPercentages = {};
        const mockWatched = {};
        const mockDurations = {};

        for (let i = 0; i < totalChapters; i++) {
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

        try {
            await axios.put('/api/enroll-course', {
                courseId: courseId,
                completedChapters: allChaptersList,
                videoProgress: demoVideoProgress,
                quizScores: mockQuizScores,
            });

            setVideoWatchSeconds(demoVideoProgress.watchedSeconds);
            setVideoDurations(demoVideoProgress.durations);
            setVideoPercentages(demoVideoProgress.percentages);
            setChapterVideos(demoVideoProgress.chapterVideos);
            setQuizScores(mockQuizScores);

            if (refreshData) refreshData();

            setShowEligibilityModal(false);
            setShowCertModal(true);
            toast.success("🎉 Demo Complete! All 4 criteria satisfied (100% chapters, 70%+ videos, 100% quiz). Certificate unlocked!");
        } catch (err) {
            console.error("Fast complete demo failed:", err);
            toast.error("Fast complete failed. Try again.");
        }
    };

    const isCompleted = completedList?.includes(selectedChapterIndex);

    const formatTime = (secs) => {
        if (!secs || isNaN(secs) || secs < 0) return "0:00";
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s.toString().padStart(2, "0")}`;
    };

    const isCurrentChapterVideoMet = (() => {
        const currentDetails = eligibility.chapterVideoDetails?.find(
            d => d.chapterIndex === selectedChapterIndex
        );
        if (currentDetails) return currentDetails.isCompleted;
        if (!videoData || videoData.length === 0) return true;
        return videoData.some(v => {
            const vId = v?.videoId || v?.id?.videoId;
            return (videoPercentages[vId] || 0) >= MIN_VIDEO_WATCH_PERCENTAGE;
        });
    })();

    return (
        <div className="p-6 md:p-10 space-y-6">
            {/* Top Certificate Status Banner */}
            <div className={`rounded-xl border p-4.5 transition-all shadow-xs ${eligibility.isEligible
                ? "bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-blue-500/15 border-amber-500/40"
                : "bg-card border-border"
                }`}>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-full ${eligibility.isEligible ? "bg-amber-600 text-white shadow-md" : "bg-muted text-muted-foreground"
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
                                    ? `Congratulations! You watched >= 70% of each chapter's video and scored ${eligibility.overallScore}% combined across all chapters (>= 75% required).`
                                    : "Watch at least 70% of each chapter's video and score min 75% combined across all chapter quizzes to earn your certificate."
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
                                    Videos: {eligibility.isVideoRequirementMet ? "70% Watched ✓" : `${eligibility.videoChaptersCompletedCount}/${eligibility.totalChaptersWithVideos} Ch (70%)`}
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

            {/* Related Videos with Live 70% Watch Tracking */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        Related Videos <PlayCircle className="w-5 h-5 text-primary" />
                    </h3>
                    <span className="text-xs text-muted-foreground">
                        {isCurrentChapterVideoMet ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Chapter video requirement met (70%+ watched)!
                            </span>
                        ) : (
                            <span>Watch at least 70% of this chapter's video</span>
                        )}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {videoData?.map((video, index) => {
                        if (index >= 4) return null;
                        const vId = video?.videoId || video?.id?.videoId;
                        const watched = videoWatchSeconds[vId] || 0;
                        const duration = videoDurations[vId] || 0;
                        const pct = videoPercentages[vId] || (duration > 0 ? Math.min(100, Math.round((watched / duration) * 100)) : 0);
                        const isMet = pct >= MIN_VIDEO_WATCH_PERCENTAGE;
                        const progressTowardGoal = Math.min(100, Math.round((pct / MIN_VIDEO_WATCH_PERCENTAGE) * 100));

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
                                        onReady={(e) => onPlayerReady(vId, e)}
                                        onStateChange={(e) => onPlayerStateChange(vId, e)}
                                    />
                                </div>

                                {/* Video Watch Progress Footer */}
                                <div className="p-3 bg-muted/20 border-t space-y-1.5">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="font-medium flex items-center gap-1.5">
                                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                                            <span>
                                                Watched: {formatTime(watched)} {duration > 0 ? `/ ${formatTime(duration)}` : ''} ({pct}%)
                                            </span>
                                        </span>
                                        {isMet ? (
                                            <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-[11px] bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                                <CheckCircle2 className="w-3 h-3" /> 70% Watched (Met)
                                            </span>
                                        ) : (
                                            <span className="text-muted-foreground text-[11px]">
                                                {pct}% / 70% required
                                            </span>
                                        )}
                                    </div>
                                    <Progress value={progressTowardGoal} className="h-1.5" />
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