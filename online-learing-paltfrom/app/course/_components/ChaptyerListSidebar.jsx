import React, { useContext } from "react";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { SelectedChapterIndexContent } from "@/context/SelectedChapterIndexContent";
import { CheckCircle } from "lucide-react";

function ChapterListSidebar({ courseInfo }) {
    const course = courseInfo?.courses;
    const enrollCourse = courseInfo?.enrollCourse;
    const chapters = course?.courseJson?.course?.chapters || (Array.isArray(course?.courseContent) ? course?.courseContent : []);
    const { selectedChapterIndex, setSelectedChapterIndex } = useContext(SelectedChapterIndexContent);
    const completedChapters = enrollCourse?.completedChapters || enrollCourse?.completedChapter || [];

    return (
        <div className="w-80 bg-secondary h-screen p-5 border-r sticky top-0 overflow-y-auto">
            <h2 className="my-3 font-bold text-xl">Chapters ({chapters?.length})</h2>
            <Accordion type="single" collapsible defaultValue="item-0">
                {chapters?.map((chapter, index) => {
                    const isChapterCompleted = Array.isArray(completedChapters) && completedChapters.includes(index);

                    return (
                        <AccordionItem
                            value={`item-${index}`}
                            key={index}
                            onClick={() => setSelectedChapterIndex(index)}
                            className={`p-2 rounded-lg my-1 transition-all ${
                                isChapterCompleted 
                                    ? "bg-green-100 text-green-900 border border-green-300 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800" 
                                    : ""
                            }`}
                        >
                            <AccordionTrigger className="text-left font-medium">
                                <div className="flex items-center justify-between w-full pr-2">
                                    <span>{index + 1}. {chapter?.chapterName || chapter?.title || `Chapter ${index + 1}`}</span>
                                    {isChapterCompleted && <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />}
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="flex flex-col gap-2 pt-2">
                                {chapter?.topics ? (
                                    chapter.topics.map((topic, topicIndex) => (
                                        <div
                                            key={topicIndex}
                                            className={`p-2 text-sm rounded-lg cursor-pointer transition-colors flex items-center justify-between ${
                                                isChapterCompleted
                                                    ? "text-green-800 dark:text-green-300 font-medium hover:bg-green-200/60 dark:hover:bg-green-900/50"
                                                    : "hover:bg-primary/10"
                                            }`}
                                        >
                                            <span>{typeof topic === 'string' ? topic : topic?.topic || topic?.name}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className={`text-xs ${isChapterCompleted ? "text-green-700 dark:text-green-400" : "text-muted-foreground"}`}>
                                        {chapter?.summary || chapter?.description || "No topics listed."}
                                    </p>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    );
                })}
            </Accordion>
        </div>
    );
}
export default ChapterListSidebar;