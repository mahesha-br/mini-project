import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

function AddNewCourseDialog({ children }) {
    const { user } = useUser();
    const router = useRouter();
    const [open, setOpen] = useState(false);

    const items = [
        { label: "Beginner", value: "beginner" },
        { label: "Moderate", value: "moderate" },
        { label: "Advanced", value: "advanced" },
    ];

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        includeVideo: false,
        noOfChapters: 1,
        category: '',
        level: ''
    });
    const [loading, setLoading] = useState(false);

    const onHandleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    }

    const onGenerate = async () => {
        setLoading(true);
        console.log("Generating course with form data:", formData);
        const courseId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();

        try {
            const response = await fetch('/api/generate-course-layout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...formData,
                    courseId: courseId,
                    userEmail: user?.primaryEmailAddress?.emailAddress
                })
            });
            const data = await response.json();
            console.log("Generated course result:", data);

            if (data?.resp === 'limit reached') {
                toast.error("Course creation limit reached! Upgrade your plan to create more courses.");
                setLoading(false);
                setOpen(false);
                router.push('/workspace/billing');
                return;
            }

            const targetCourseId = data?.courseId || data?.result?.cid || courseId;
            if (response.ok && targetCourseId) {
                setLoading(false);
                setOpen(false);
                router.push('/workspace/edit-course/' + targetCourseId);
            } else {
                console.error("Error storing course to database:", data?.error || data);
                toast.error("Failed to generate course layout");
                setLoading(false);
            }
        } catch (error) {
            console.error("Error generating course layout:", error);
            toast.error("Something went wrong");
            setLoading(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!loading) setOpen(val);
        }}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Course using AI</DialogTitle>
                    <DialogDescription asChild>
                        <div className="flex flex-col gap-4 mt-3">
                            <div>
                                <label>Course Name</label>
                                <Input placeholder="Course Name" onChange={(event) => onHandleInputChange('name', event?.target.value)} disabled={loading} />
                            </div>
                            <div>
                                <label>Course Description (optional)</label>
                                <Textarea placeholder="Course Description" onChange={(event) => onHandleInputChange('description', event?.target.value)} disabled={loading} />
                            </div>
                            <div>
                                <label>No. of Chapters</label>
                                <Input type="number" placeholder="No. of chapters"
                                    onChange={(event) => onHandleInputChange('noOfChapters', Number(event?.target.value))}
                                    disabled={loading}
                                />
                            </div>
                            <div className="flex gap-3 items-center">
                                <label>Include video</label>
                                <Switch
                                    onCheckedChange={(checked) => onHandleInputChange('includeVideo', checked)}
                                    disabled={loading}
                                />
                            </div>
                            <div>
                                <label>Difficulty level</label>
                                <Select onValueChange={(value) => onHandleInputChange('level', value)} disabled={loading}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Difficulty level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            {items.map((item) => (
                                                <SelectItem key={item.value} value={item.value}>
                                                    {item.label}
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label>Category</label>
                                <Input placeholder="Category"
                                    onChange={(event) => onHandleInputChange('category', event?.target.value)}
                                    disabled={loading}
                                />
                            </div>
                            <div className="mt-5">
                                <Button className="w-full flex items-center justify-center gap-2" onClick={onGenerate} disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Generating Course & Redirecting...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-4 w-4" />
                                            Generate Course
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
}

export default AddNewCourseDialog;