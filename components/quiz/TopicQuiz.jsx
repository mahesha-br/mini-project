"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { CheckCircle2, XCircle, HelpCircle, RotateCcw, Award, ChevronDown, ChevronUp, Loader2, Sparkles, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TopicQuiz({
    topicKey,
    topicTitle,
    topicContent,
    chapterName,
    courseTitle,
    existingScore,
    onQuizCompleted,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [selectedAnswers, setSelectedAnswers] = useState({});

    // Initialize from existing score if already taken
    const [result, setResult] = useState(() => {
        if (existingScore && (typeof existingScore.score === 'number' || typeof existingScore.percentage === 'number')) {
            const score = existingScore.score ?? Math.round((existingScore.percentage / 100) * (existingScore.total || 3));
            const total = existingScore.total || 3;
            const percentage = existingScore.percentage ?? Math.round((score / total) * 100);
            return {
                score,
                total,
                percentage,
                passed: percentage >= 75
            };
        }
        return null;
    });

    const [submitted, setSubmitted] = useState(() => {
        return !!(existingScore && (typeof existingScore.score === 'number' || typeof existingScore.percentage === 'number'));
    });

    const loadQuestions = async () => {
        if (questions.length > 0) return;
        setLoading(true);
        try {
            const res = await axios.post("/api/topic-quiz", {
                topicTitle,
                topicContent,
                chapterName,
                courseTitle,
            });
            if (res.data?.questions) {
                setQuestions(res.data.questions);
            }
        } catch (error) {
            console.error("Failed to load topic quiz questions:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleOpen = () => {
        const nextState = !isOpen;
        setIsOpen(nextState);
        if (nextState && questions.length === 0) {
            loadQuestions();
        }
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
            onQuizCompleted(topicKey, quizResult);
        }
    };

    const handleRetake = () => {
        setSelectedAnswers({});
        setSubmitted(false);
        setResult(null);
        if (questions.length === 0) {
            loadQuestions();
        }
    };

    const isAllAnswered = questions.length > 0 && Object.keys(selectedAnswers).length === questions.length;

    return (
        <div className="mt-4 border rounded-xl bg-card overflow-hidden transition-all shadow-xs">
            {/* Header / Summary Bar */}
            <div
                onClick={handleToggleOpen}
                className="p-3.5 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-muted/40 transition-colors select-none"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${result
                        ? (result.passed ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400")
                        : "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        }`}>
                        {result ? (
                            result.passed ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />
                        ) : (
                            <HelpCircle className="w-4 h-4" />
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm">Topic Quiz: {topicTitle}</h4>
                            {result && (
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${result.passed
                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300"
                                    : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300"
                                    }`}>
                                    Score: {result.score}/{result.total} ({result.percentage}%) {result.passed ? "• Passed" : "• < 75%"}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {result
                                ? (result.passed
                                    ? "Topic requirements met! Contributes to your 75% certificate criteria."
                                    : "Score is below 75%. Retake to boost your overall certificate average.")
                                : "Attend this 3-question quiz to qualify for your course certificate (75% min required)."
                            }
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {!isOpen && !result && (
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-blue-400/50 text-blue-600 hover:bg-blue-50">
                            Attend Quiz
                        </Button>
                    )}
                    {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
            </div>

            {/* Quiz Body */}
            {isOpen && (
                <div className="p-4 sm:p-5 border-t bg-muted/10 space-y-5">
                    {loading ? (
                        <div className="py-8 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                            <p className="text-xs">Preparing questions for {topicTitle}...</p>
                        </div>
                    ) : questions.length === 0 ? (
                        <div className="text-center py-6">
                            <p className="text-xs text-muted-foreground mb-3">No questions loaded yet.</p>
                            <Button size="sm" onClick={loadQuestions}>Load Quiz</Button>
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
                                                {result.passed ? "🎉 Great Job! Quiz Passed!" : "⚠️ Needs Improvement (Min 75% needed)"}
                                            </h5>
                                            <p className="text-xs opacity-90">
                                                You scored {result.score} out of {result.total} questions ({result.percentage}%).
                                                {result.passed
                                                    ? " This topic satisfies your certificate requirement!"
                                                    : " You need at least 75% across topics to unlock your certificate."
                                                }
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleRetake}
                                        className="h-8 text-xs gap-1.5 shrink-0 bg-background hover:bg-muted"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" /> Retake Quiz
                                    </Button>
                                </div>
                            )}

                            {/* Questions List */}
                            <div className="space-y-4">
                                {questions.map((q, qIdx) => {
                                    const userAnswer = selectedAnswers[qIdx];
                                    const isCorrect = submitted && userAnswer === q.correctIndex;

                                    return (
                                        <div
                                            key={q.id || qIdx}
                                            className={`p-4 rounded-xl border transition-all ${submitted
                                                ? (isCorrect ? "border-emerald-500/40 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/5")
                                                : "border-border bg-card"
                                                }`}
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-3">
                                                <h5 className="font-medium text-sm text-foreground">
                                                    <span className="font-bold text-muted-foreground mr-1.5">Q{qIdx + 1}.</span>
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
                                                            className={`p-3 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${optionStyle}`}
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
                                                <div className="mt-3 p-2.5 rounded-lg bg-background border text-[11px] text-muted-foreground">
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
                                        <Sparkles className="w-3.5 h-3.5" /> Submit Topic Quiz
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex justify-end pt-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleRetake}
                                        className="text-xs gap-1.5"
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
