"use client";
import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Award, Edit3, Check, Sparkles } from "lucide-react";
import CertificateView from "./CertificateView";

export default function CertificateModal({
    isOpen,
    onClose,
    course,
    recipientName = "Student Name",
    completionDate = null,
}) {
    const courseData = course?.courses || course?.course || course;
    const courseTitle = courseData?.courseJson?.course?.name || courseData?.name || "Completed Course";

    const [customName, setCustomName] = useState("");
    const [isEditingName, setIsEditingName] = useState(false);
    const displayName = customName.trim() || recipientName;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl w-full p-4 md:p-6 max-h-[95vh] overflow-y-auto">
                <DialogHeader className="mb-2">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                                <Award className="w-5 h-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                    Official Certificate of Completion
                                    <Sparkles className="w-4 h-4 text-amber-500" />
                                </DialogTitle>
                                <DialogDescription className="text-xs text-muted-foreground">
                                    Issued for achieving 100% completion in {courseTitle}
                                </DialogDescription>
                            </div>
                        </div>

                        {/* Name Customizer Toggle */}
                        <div className="flex items-center gap-2 text-sm">
                            {isEditingName ? (
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={customName !== "" ? customName : recipientName}
                                        onChange={(e) => setCustomName(e.target.value)}
                                        placeholder="Enter your full name"
                                        className="h-8 text-xs w-48"
                                    />
                                    <Button
                                        size="sm"
                                        variant="default"
                                        className="h-8 text-xs px-2"
                                        onClick={() => setIsEditingName(false)}
                                    >
                                        <Check className="w-3.5 h-3.5 mr-1" /> Done
                                    </Button>
                                </div>
                            ) : (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-8 text-xs gap-1.5"
                                    onClick={() => setIsEditingName(true)}
                                >
                                    <Edit3 className="w-3 h-3 text-muted-foreground" />
                                    <span>Edit Certificate Name</span>
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                {/* Certificate Display */}
                <div className="mt-2 flex justify-center w-full overflow-x-auto pb-4">
                    <CertificateView
                        recipientName={displayName || recipientName}
                        courseName={courseTitle}
                        completionDate={completionDate}
                        showActions={true}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
