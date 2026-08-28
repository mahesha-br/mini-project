import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
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
} from "@/components/ui/select"
import { Button } from "@/components/ui/button";
import { Sparkle } from "lucide-react";


function AddNewCourseDialog({ children }) {
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


    const onHandleInputCgange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        console.log(formData);
    }
    const onGenerate = () => {
        console.log(formData)
    }

    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Course using AI</DialogTitle>
                    <DialogDescription asChild>
                        <div className="flex flex-col gap-4 mt-3">
                            <div>
                                <label>Course Name</label>
                                <Input placeholder="Course Name" onChange={(event) => onHandleInputCgange('courseName', event?.target.value)} />
                            </div>
                            <div>
                                <label>Course Description (optional)</label>
                                <Textarea placeholder="Course Description" onChange={(event) => onHandleInputCgange('description', event?.target.value)} />
                            </div>
                            <div>
                                <label>No. of Chapters</label>
                                <Input type="number" placeholder="No. of chapters"
                                    onChange={(event) => onHandleInputCgange('noOfChapters', event?.target.value)}
                                />
                            </div>
                            <div className="flex gap-3 items-center">
                                <label>Include video</label>
                                <Switch
                                    onCheckedChange={() => onHandleInputCgange('includeVideo', !formData?.includeVideo)} />
                            </div>
                            <div>
                                <label>Difficulty level</label>
                                <Select onValueChange={(value) => onHandleInputCgange('level', value)}>
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
                                    onChange={(event) => onHandleInputCgange('category', event?.target.value)}
                                />
                            </div>
                            <div className="mt-5">
                                <Button className="w-full" onClick={onGenerate}><Sparkle /> Generate Course</Button>
                            </div>
                        </div>
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
}

export default AddNewCourseDialog;