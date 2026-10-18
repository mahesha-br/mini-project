"use client";
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
    CheckCircle2,
    XCircle,
    RotateCcw,
    Award,
    ChevronDown,
    ChevronUp,
    Loader2,
    Sparkles,
    Check,
    AlertCircle,
    BookOpen
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ChapterQuiz({
    chapterKey,
    chapterIndex,
    chapterName,
    courseTitle,
    topics,
    existingScore,
    onQuizCompleted,
}) {
    const [isOpen, setIsOpen] = useState(true);
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [result, setResult] = useState(null);
    const [submitted, setSubmitted] = useState(false);

    // Cache questions across chapter switches in memory to avoid redundant re-fetching
    const questionsCacheRef = useRef({});

    // When chapterKey, chapterIndex, chapterName or existingScore changes, update state & load chapter questions
    useEffect(() => {
        // Reset answers for the selected chapter
        setSelectedAnswers({});

        // Sync result and submitted with existingScore for this specific chapter
        if (existingScore && (typeof existingScore.score === 'number' || typeof existingScore.percentage === 'number')) {
            const score = existingScore.score ?? Math.round((existingScore.percentage / 100) * (existingScore.total || 3));
            const total = existingScore.total || 3;
            const percentage = existingScore.percentage ?? Math.round((score / total) * 100);
            setResult({
                score,
                total,
                percentage,
                passed: percentage >= 75
            });
            setSubmitted(true);
        } else {
            setResult(null);
            setSubmitted(false);
        }

        // If questions for this chapter are already cached, use them immediately
        if (questionsCacheRef.current[chapterKey]?.length > 0) {
            setQuestions(questionsCacheRef.current[chapterKey]);
            setLoading(false);
            return;
        }

        // Otherwise fetch fresh questions specifically for this chapter
        let isCancelled = false;
        setLoading(true);
        setQuestions([]);

        axios.post("/api/chapter-quiz", {
            chapterIndex,
            chapterName,
            courseTitle,
            topics,
        }).then((res) => {
            if (!isCancelled && Array.isArray(res.data?.questions) && res.data.questions.length > 0) {
                questionsCacheRef.current[chapterKey] = res.data.questions;
                setQuestions(res.data.questions);
            }
        }).catch((err) => {
            console.error(`Failed to load quiz for chapter ${chapterIndex + 1}:`, err);
        }).finally(() => {
            if (!isCancelled) setLoading(false);
        });

        return () => {
            isCancelled = true;
        };
    }, [chapterKey, chapterIndex, chapterName]);

    const handleToggleOpen = () => {
        setIsOpen(!isOpen);
    };

    const handleSelectOption = (questionIndex, optionIndex) => {
        if (submitted) return; // Prevent changing after submit until retake
        setSelectedAnswers((prev) => ({
            ...prev,
            [questionIndex]: optionIndex,
        }));
    };

    const handleSubmitQuiz = () => {
        if (!questions.length) return;

        let score = 0;
        questions.forEach((q, idx) => {
            if (selectedAnswers[idx] === q.correctIndex) {
                score++;
            }
        });

        const total = questions.length;
        const percentage = Math.round((score / total) * 100);
        const passed = percentage >= 75;

        const quizResult = {
            score,
            total,
            percentage,
            passed,
            completedAt: new Date().toISOString(),
        };

        setResult(quizResult);
        setSubmitted(true);

        if (onQuizCompleted) {
            onQuizCompleted(chapterKey, quizResult);
        }
    };

    const handleRetake = () => {
        setSelectedAnswers({});
        setSubmitted(false);
        setResult(null);
    };

    const isAllAnswered = questions.length > 0 && Object.keys(selectedAnswers).length === questions.length;

    return (
        <div className="border-2 border-primary/20 rounded-2xl bg-card overflow-hidden transition-all shadow-sm">
            {/* Header / Summary Bar */}
            <div
                onClick={handleToggleOpen}
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-muted/40 transition-colors select-none bg-gradient-to-r from-blue-500/5 via-primary/5 to-purple-500/5"
            >
                <div className="flex items-center gap-3.5">
                    <div className={`p-2.5 rounded-xl ${result
                        ? (result.passed ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/15 text-amber-600 dark:text-amber-400")
                        : "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                        }`}>
                        {result ? (
                            result.passed ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />
                        ) : (
                            <BookOpen className="w-5 h-5" />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-base">
                                Chapter {chapterIndex + 1} Quiz &bull; {chapterName}
                            </h4>
                            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200">
                                3 Questions
                            </span>
                            {result && (
                                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${result.passed
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300"
                                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300"
                                    }`}>
                                    Score: {result.score}/{result.total} ({result.percentage}%) {result.passed ? "• Passed" : "• Needs >= 75% Combined"}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {result
                                ? (result.passed
                                    ? "Chapter quiz completed! Contributes to your overall 75% combined requirement."
                                    : "Chapter score is below 75%. You can retake anytime to boost your combined certificate average.")
                                : "Answer all 3 questions on this chapter. Score at least 75% combined across all chapters to earn your certificate."
                            }
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
            </div>

            {/* Quiz Body */}
            {isOpen && (
                <div className="p-4 sm:p-6 border-t bg-muted/10 space-y-5">
                    {loading ? (
                        <div className="py-10 flex flex-col items-center justify-center gap-2.5 text-muted-foreground">
                            <Loader2 className="w-7 h-7 animate-spin text-primary" />
                            <p className="text-xs font-medium">Loading questions for Chapter {chapterIndex + 1}: {chapterName}...</p>
                        </div>
                    ) : questions.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-sm text-muted-foreground mb-3 font-medium">
                                Ready to test what you learned in {chapterName}?
                            </p>
                            <Button
                                size="sm"
                                onClick={() => {
                                    setLoading(true);
                                    axios.post("/api/chapter-quiz", {
                                        chapterIndex,
                                        chapterName,
                                        courseTitle,
                                        topics,
                                    }).then(res => {
                                        if (res.data?.questions) {
                                            questionsCacheRef.current[chapterKey] = res.data.questions;
                                            setQuestions(res.data.questions);
                                        }
                                    }).finally(() => setLoading(false));
                                }}
                                className="gap-1.5 cursor-pointer"
                            >
                                <Sparkles className="w-3.5 h-3.5" /> Load 3 Questions
                            </Button>
                        </div>
                    ) : (
                        <>
                            {/* Quiz Score Banner when submitted */}
                            {submitted && result && (
                                <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${result.passed
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-100"
                                    : "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-100"
                                    }`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-full ${result.passed ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"}`}>
                                            <Award className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h5 className="font-bold text-sm">
                                                {result.passed ? "🎉 Great Job! Chapter Quiz Passed!" : "⚠️ Needs Improvement (Combined 75% needed across chapters)"}
                                            </h5>
                                            <p className="text-xs opacity-90 mt-0.5">
                                                You scored {result.score} out of {result.total} questions ({result.percentage}%).
                                                {result.passed
                                                    ? " This chapter fulfills your certificate passing criteria!"
                                                    : " You need at least 75% combined across all chapters to earn your certificate."
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleRetake}
                                        className="h-8 text-xs gap-1.5 shrink-0 bg-background hover:bg-muted cursor-pointer"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" /> Retake Quiz
                                    </Button>
                                </div>
                            )}

                            {/* Questions List (3 Questions) */}
                            <div className="space-y-4">
                                {questions.map((q, qIdx) => {
                                    const userAnswer = selectedAnswers[qIdx];
                                    const isCorrect = submitted && userAnswer === q.correctIndex;

                                    return (
                                        <div
                                            key={q.id || qIdx}
                                            className={`p-4 sm:p-5 rounded-xl border transition-all ${submitted
                                                ? (isCorrect ? "border-emerald-500/40 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/5")
                                                : "border-border bg-card"
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                <h5 className="font-semibold text-sm text-foreground leading-relaxed">
                                                    <span className="font-bold text-primary mr-1.5">Question {qIdx + 1} of 3:</span>
                                                    {q.question}
                                                </h5>
                                                {submitted && (
                                                    isCorrect ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0">
                                                            <Check className="w-3 h-3" /> Correct (+1)
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-full shrink-0">
                                                            <XCircle className="w-3 h-3" /> Incorrect (0)
                                                        </span>
                                                    )
                                                )}
                                            </div>

                                            {/* Options */}
                                            <div className="grid grid-cols-1 gap-2">
                                                {q.options?.map((option, optIdx) => {
                                                    const isSelected = userAnswer === optIdx;
                                                    const isOptionCorrect = q.correctIndex === optIdx;

                                                    let optionStyle = "border-border hover:bg-muted/50 text-foreground";
                                                    if (submitted) {
                                                        if (isOptionCorrect) {
                                                            optionStyle = "border-emerald-500 bg-emerald-500/15 text-emerald-900 dark:text-emerald-100 font-medium";
                                                        } else if (isSelected && !isOptionCorrect) {
                                                            optionStyle = "border-rose-500 bg-rose-500/15 text-rose-900 dark:text-rose-100";
                                                        } else {
                                                            optionStyle = "border-border/50 text-muted-foreground opacity-60";
                                                        }
                                                    } else if (isSelected) {
                                                        optionStyle = "border-blue-600 bg-blue-500/10 text-blue-700 dark:text-blue-300 font-medium ring-1 ring-blue-500";
                                                    }

                                                    return (
                                                        <div
                                                            key={optIdx}
                                                            onClick={() => handleSelectOption(qIdx, optIdx)}
                                                            className={`p-3 rounded-lg border text-xs sm:text-sm flex items-center justify-between cursor-pointer transition-all ${optionStyle}`}
                                                        >
                                                            <div className="flex items-center gap-2.5">
                                                                <span className="w-5 h-5 rounded-full border flex items-center justify-center font-bold text-[10px] shrink-0 bg-background/80">
                                                                    {String.fromCharCode(65 + optIdx)}
                                                                </span>
                                                                <span>{option}</span>
                                                            </div>
                                                            {submitted && isOptionCorrect && (
                                                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                                            )}
                                                            {submitted && isSelected && !isOptionCorrect && (
                                                                <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Explanation */}
                                            {submitted && q.explanation && (
                                                <div className="mt-3 p-3 rounded-lg bg-background border text-xs text-muted-foreground">
                                                    <span className="font-semibold text-foreground">Explanation: </span>
                                                    {q.explanation}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Actions */}
                            {!submitted ? (
                                <div className="flex items-center justify-between pt-2">
                                    <p className="text-xs text-muted-foreground">
                                        Answered {Object.keys(selectedAnswers).length} of {questions.length} questions
                                    </p>
                                    <Button
                                        size="sm"
                                        disabled={!isAllAnswered}
                                        onClick={handleSubmitQuiz}
                                        className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                                    >
                                        <Sparkles className="w-3.5 h-3.5" /> Submit Chapter Quiz
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex justify-end pt-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleRetake}
                                        className="text-xs gap-1.5 cursor-pointer"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" /> Retake to Improve Score
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
