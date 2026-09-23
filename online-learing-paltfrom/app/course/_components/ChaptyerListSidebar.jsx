import React, { useContext } from "react";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { SelectedChapterIndexContent } from "@/context/SelectedChapterIndexContent";

function ChapterListSidebar({ courseInfo }) {
    const course = courseInfo?.courses;
    const enrollCourse = courseInfo?.enrollCourse;
    const chapters = course?.courseJson?.course?.chapters || (Array.isArray(course?.courseContent) ? course?.courseContent : []);
    const { selectedChapterIndex, setSelectedChapterIndex } = useContext(SelectedChapterIndexContent);


    return (
        <div className="w-80 bg-secondary h-screen p-5 border-r overflow-y-auto">
            <h2 className="my-3 font-bold text-xl">Chapters ({chapters?.length})</h2>
            <Accordion type="single" collapsible defaultValue="item-0">
                {chapters?.map((chapter, index) => (
                    <AccordionItem value={`item-${index}`} key={index}
                        onClick={() => setSelectedChapterIndex(index)}
                    >
                        <AccordionTrigger className="text-left font-medium">
                            {index + 1}. {chapter?.chapterName || chapter?.title || `Chapter ${index + 1}`}
                        </AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-2 pt-2">
                            {chapter?.topics ? (
                                chapter.topics.map((topic, topicIndex) => (
                                    <div
                                        key={topicIndex}
                                        className="p-2 text-sm rounded-lg hover:bg-primary/10 cursor-pointer transition-colors flex items-center justify-between"
                                    >
                                        <span>{typeof topic === 'string' ? topic : topic?.topic || topic?.name}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-muted-foreground">{chapter?.summary || chapter?.description || "No topics listed."}</p>
                            )}
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </div>
    );
}
export default ChapterListSidebar;