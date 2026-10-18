import { Button } from "@/components/ui/button";
import { SelectedChapterIndexContent } from "@/context/SelectedChapterIndexContent";
import axios from "axios";
import { Award, CheckCircle, Loader2, PlayCircle, Sparkles } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useContext, useState } from "react";
import YouTube from 'react-youtube';
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import CertificateModal from "@/components/certificate/CertificateModal";

function ChapterContent({ courseInfo, refreshData }) {
    const { user } = useUser();
    const { courseId } = useParams();
    const [markingComplete, setMarkingComplete] = useState(false);
    const [showCertModal, setShowCertModal] = useState(false);
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

    const totalChapters = courseContent?.length || chapters?.length || course?.noOfChapters || 1;
    const completedList = (enrollCourse?.completedChapters || enrollCourse?.completedChapter || []);
    const isAllCompleted = completedList?.length >= totalChapters;
    const recipientName = user?.fullName || user?.firstName || user?.username || "Student Name";

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
                if (refreshData) {
                    refreshData();
                }

                if (completedChapters.length >= totalChapters) {
                    toast.success('🎉 Congratulations! You have completed 100% of this course! Your Certificate is ready!', {
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

    const isCompleted = completedList?.includes(selectedChapterIndex);

    return (
        <div className="p-6 md:p-10 space-y-6">
            {/* 100% Completed Celebration Ribbon */}
            {isAllCompleted && (
                <div className="rounded-xl bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-blue-500/15 border border-amber-500/30 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-full bg-amber-500 text-white shadow-md">
                            <Award className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-base flex items-center gap-1.5">
                                <span>Course 100% Completed!</span>
                                <Sparkles className="w-4 h-4 text-amber-500" />
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Your official Certificate of Completion has been generated and is ready to view or download.
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setShowCertModal(true)}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1.5 text-xs shrink-0 cursor-pointer"
                    >
                        <Award className="w-4 h-4" /> View My Certificate
                    </Button>
                </div>
            )}

            <div className="flex justify-between items-center">
                <h2 className="font-bold text-2xl">{selectedChapterIndex + 1}. {chapterName}</h2>
                <Button onClick={() => markChapterCompleted()} disabled={isCompleted || markingComplete}>
                    {markingComplete ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <CheckCircle />
                    )}
                    {isCompleted ? 'Completed' : markingComplete ? 'Saving...' : 'Mark as completed'}
                </Button>
            </div>
            <h2 className="my-2 font-bold text-lg flex gap-2">Related Videos<PlayCircle /></h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols3 gap-5">
                {videoData?.map((video, index) => index < 4 && (
                    <div key={index}>
                        <YouTube
                            videoId={video?.videoId || video?.id?.videoId}
                            opts={{
                                height: '280',
                                width: '480',

                            }}
                        />

                    </div>
                ))}
            </div>
            <div className="mt-7">
                {topics?.map((item, index) => {
                    const topicTitle = typeof item === 'string' ? item : (item?.topic || item?.topics || item?.topicName || item?.title);
                    const topicContent = typeof item === 'object' ? item?.content : null;

                    return (
                        <div key={index} className="my-4 bg-secondary rounded-2xl p-5">
                            <h2 className="font-bold text-lg">{topicTitle}</h2>
                            {topicContent && (
                                typeof topicContent === 'string' && topicContent.includes('<') ? (
                                    <div dangerouslySetInnerHTML={{ __html: topicContent }}
                                        style={{
                                            lineHeight: '2.5'
                                        }}
                                    />
                                ) : (
                                    <p>{topicContent}</p>
                                )
                            )}
                        </div>
                    );
                })}

            </div>

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
    )
}
export default ChapterContent