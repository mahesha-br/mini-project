import React from "react";
import { Gift } from "lucide-react";

function ChapterTopicList({ course }) {
    const courseLayout = course?.courseJson?.course;

    return (
        <div className="mt-10">
            <h2 className="font-bold text-3xl text-center md:text-left">Chapters & Topics</h2>

            <div className='flex flex-col items-center justify-center mt-10'>
                {courseLayout?.chapters?.map((chapter, index) => (
                    <div key={index} className='flex flex-col items-center'>
                        <div className='p-4 border shadow rounded-xl bg-primary text-white min-w-[300px] text-center'>
                            <h2 className='text-center'>Chapter {index + 1}</h2>
                            <h2 className='font-bold text-lg text-center mt-1'>{chapter?.chapterName}</h2>
                            <h2 className='text-xs flex justify-between gap-16 mt-3'>
                                <span>Duration: {chapter?.duration}</span>
                                <span>No. Of Topics: {chapter?.topics?.length}</span>
                            </h2>
                        </div>
                        <div>
                            {chapter?.topics?.map((topic, topicIndex) => (
                                <div className='flex flex-col items-center' key={topicIndex}>
                                    <div className='h-10 bg-gray-300 w-1'></div>
                                    <div className='flex items-center gap-5'>
                                        <span className={`${topicIndex % 2 == 0 && 'text-transparent'} max-w-xs text-right w-[150px] sm:w-[200px]`}>{topic}</span>
                                        <h2 className='text-center rounded-full bg-gray-300 px-5 py-3 text-gray-600 font-semibold min-w-[44px]'>{topicIndex + 1}</h2>
                                        <span className={`${topicIndex % 2 != 0 && 'text-transparent'} max-w-xs text-left w-[150px] sm:w-[200px]`}>{topic}</span>
                                    </div>
                                    {topicIndex == chapter?.topics?.length - 1 && <div className='h-10 bg-gray-300 w-1'></div>}
                                    {topicIndex == chapter?.topics?.length - 1 && (
                                        <div className='flex items-center gap-5'>
                                            <Gift className='text-center rounded-full bg-gray-300 h-14 w-14 text-gray-500 p-4' />
                                        </div>
                                    )}
                                    {topicIndex == chapter?.topics?.length - 1 && <div className='h-10 bg-gray-300 w-1'></div>}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                <div className='p-4 border shadow rounded-xl bg-green-600 text-white min-w-[160px] text-center font-bold'>
                    <h2>Finish</h2>
                </div>
            </div>
        </div>
    );
}

export default ChapterTopicList;