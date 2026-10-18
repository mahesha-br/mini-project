"use client";
import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Award, CheckCircle2, Lock, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function CertificateEligibilityModal({
    isOpen,
    onClose,
    eligibility,
    courseTitle,
    onOpenCertificate,
    onFastCompleteDemo,
}) {
    if (!eligibility) return null;

    const {
        isEligible,
        checklist = [],
        overallScore = 0,
        minPassingScore = 75,
    } = eligibility;

    const completedCriteriaCount = checklist.filter(c => c.isCompleted).length;
    const totalCriteria = checklist.length || 4;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-xl w-full p-6">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${isEligible ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"}`}>
                            {isEligible ? <Award className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                {isEligible ? "🎉 Certificate Unlocked!" : "Certificate Requirements"}
                                {isEligible && <Sparkles className="w-4 h-4 text-amber-500" />}
                            </DialogTitle>
                            <DialogDescription className="text-xs text-muted-foreground">
                                {courseTitle || "Course Certificate"}
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="my-2 space-y-4">
                    {/* Overall Summary Card */}
                    <div className={`p-4 rounded-xl border flex items-center justify-between ${isEligible
                        ? "bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-blue-500/10 border-amber-500/30"
                        : "bg-muted/40 border-border"
                        }`}>
                        <div>
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Eligibility Status
                            </span>
                            <h4 className="text-base font-bold flex items-center gap-1.5 mt-0.5">
                                {isEligible ? (
                                    <span className="text-emerald-600 dark:text-emerald-400">All Requirements Satisfied!</span>
                                ) : (
                                    <span className="text-amber-600 dark:text-amber-400">
                                        {completedCriteriaCount} of {totalCriteria} Requirements Met
                                    </span>
                                )}
                            </h4>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {isEligible
                                    ? `Combined Quiz Score: ${overallScore}% across chapters (Minimum ${minPassingScore}% required)`
                                    : "Complete the remaining tasks below to generate your official certificate."
                                }
                            </p>
                        </div>

                        <div className="text-right">
                            <span className="text-2xl font-black text-foreground">{Math.round((completedCriteriaCount / totalCriteria) * 100)}%</span>
                            <p className="text-[10px] text-muted-foreground font-medium">Ready</p>
                        </div>
                    </div>

                    {/* Requirements Checklist */}
                    <div className="space-y-3">
                        {checklist.map((item) => (
                            <div
                                key={item.id}
                                className={`p-3.5 rounded-xl border transition-all ${item.isCompleted
                                    ? "bg-emerald-500/5 border-emerald-500/30"
                                    : "bg-card border-border"
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-2.5">
                                        <div className="mt-0.5">
                                            {item.isCompleted ? (
                                                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                            ) : (
                                                <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/40 flex items-center justify-center text-[10px] text-muted-foreground font-bold">
                                                    !
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h5 className="font-semibold text-sm flex items-center gap-2">
                                                <span>{item.title}</span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.isCompleted
                                                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                                    : "bg-muted text-muted-foreground"
                                                    }`}>
                                                    {item.badge}
                                                </span>
                                            </h5>
                                            <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-2.5">
                                    <Progress value={item.progress} className="h-1.5" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t">
                    {onFastCompleteDemo && !isEligible && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onFastCompleteDemo}
                            className="text-xs text-muted-foreground hover:text-foreground h-8"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-amber-500 mr-1" /> Pass All (Quick Demo)
                        </Button>
                    )}

                    <div className="flex items-center gap-2 ml-auto w-full sm:w-auto">
                        <Button variant="outline" size="sm" onClick={onClose} className="text-xs w-full sm:w-auto">
                            Close
                        </Button>
                        {isEligible ? (
                            <Button
                                size="sm"
                                onClick={() => {
                                    onClose();
                                    if (onOpenCertificate) onOpenCertificate();
                                }}
                                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs gap-1.5 w-full sm:w-auto cursor-pointer"
                            >
                                <Award className="w-4 h-4" /> View My Certificate
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                disabled
                                className="text-xs gap-1.5 opacity-60 w-full sm:w-auto"
                            >
                                <Lock className="w-3.5 h-3.5" /> Certificate Locked
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
