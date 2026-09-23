import { SelectedChapterIndexContent } from "@/context/SelectedChapterIndexContent";
import { PlayCircle } from "lucide-react";
import React, { useContext } from "react";
import YouTube from 'react-youtube';

function ChapterContent({ courseInfo }) {
    const { course, enrollCourse } = courseInfo || {};
    const courseContent = courseInfo?.courses?.courseContent;
    const { selectedChapterIndex, setSelectedChapterIndex } = useContext(SelectedChapterIndexContent);
    const videoData = courseContent?.[selectedChapterIndex]?.youtubeVideo
    return (
        <div className="p-10">

            <h2 className="font-bold text-2xl">{selectedChapterIndex + 1}. {courseContent?.[selectedChapterIndex]?.courseData?.chapterName || courseContent?.[selectedChapterIndex]?.chapterName}</h2>

            <h2 className="my-2 font-bold text-lg flex gap-2">Related Videos<PlayCircle /></h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols3 gap-5">
                {videoData?.map((video, index) => index < 3 && (
                    <div key={index}>
                        <YouTube
                            videoId={video.videoId}
                            opts={{
                                height: '280',
                                width: '480',

                            }}
                        />

                    </div>
                ))}
            </div>

        </div>
    )
}
export default ChapterContent