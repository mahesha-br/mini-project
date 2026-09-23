import { Button } from "@/components/ui/button";
import { SelectedChapterIndexContent } from "@/context/SelectedChapterIndexContent";
import axios from "axios";
import { CheckCircle, PlayCircle } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useContext } from "react";
import YouTube from 'react-youtube';
import { toast } from "sonner";

function ChapterContent({ courseInfo, refreshData }) {
    const { courseId } = useParams();
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

    const markChapterCompleted = async () => {
        let completedChapters = Array.isArray(enrollCourse?.completedChapters)
            ? [...enrollCourse.completedChapters]
            : (Array.isArray(enrollCourse?.completedChapter) ? [...enrollCourse.completedChapter] : []);

        if (!completedChapters.includes(selectedChapterIndex)) {
            completedChapters.push(selectedChapterIndex);
            const result = await axios.put('/api/enroll-course', {
                courseId: courseId,
                completedChapters: completedChapters
            });
            console.log("Updated completed chapters:", result.data);
            refreshData && refreshData();
            toast.success('Chapter Marked as Completed!');
        } else {
            toast.info('Chapter already marked as completed!');
        }
    };

    const isCompleted = (enrollCourse?.completedChapters || enrollCourse?.completedChapter || [])?.includes(selectedChapterIndex);

    return (
        <div className="p-10">
            <div className="flex justify-between items-center">
                <h2 className="font-bold text-2xl">{selectedChapterIndex + 1}. {chapterName}</h2>
                <Button onClick={() => markChapterCompleted()} disabled={isCompleted}>
                    <CheckCircle /> {isCompleted ? 'Completed' : 'Mark as completed'}
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

        </div>
    )
}
export default ChapterContent