"use client";
import React from "react";
import { Download, Award, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Format a date into "Month DD, YYYY" (e.g. "November 10, 2026")
 */
export function formatCertificateDate(dateInput) {
    if (!dateInput) {
        return new Date().toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    }
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) {
        return new Date().toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    }
    return d.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    });
}

/**
 * Generate a deterministic Certificate ID
 */
export function generateCertificateId(courseId, userEmail) {
    const raw = `${courseId || 'course'}-${userEmail || 'user'}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
        hash = ((hash << 5) - hash) + raw.charCodeAt(i);
        hash |= 0;
    }
    const code = Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
    return `OLP-${code.slice(0, 4)}-${code.slice(4, 8)}`;
}

export default function CertificateView({
    recipientName = "Student Name",
    courseName = "Course Name",
    completionDate = null,
    certificateId = null,
    score = null,
    instructorName = "Aaron Loeb",
    instructorTitle = "Training Coordinator",
    showActions = true,
    compact = false
}) {
    const formattedDate = formatCertificateDate(completionDate);
    const certId = certificateId || generateCertificateId(courseName, recipientName);

    // Native High-Res HTML5 Canvas PNG Exporter (2400x1700 300DPI)
    const handleDownloadPng = async () => {
        try {
            try {
                await document.fonts.load('60px "Great Vibes"');
                await document.fonts.load('bold 40px "Montserrat"');
            } catch {
                // proceed if font loading API unavailable
            }

            const canvas = document.createElement("canvas");
            const width = 2400;
            const height = 1700;
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");

            // 1. White Background
            ctx.fillStyle = "#FFFFFF";
            ctx.fillRect(0, 0, width, height);

            // 2. Corner Waves - Top Right
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(width - 900, 0);
            ctx.bezierCurveTo(width - 550, 60, width - 200, 320, width, 240);
            ctx.lineTo(width, 0);
            ctx.closePath();
            ctx.fillStyle = "#0F3B66";
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(width - 700, 0);
            ctx.bezierCurveTo(width - 400, 40, width - 150, 220, width, 160);
            ctx.lineTo(width, 0);
            ctx.closePath();
            ctx.fillStyle = "#38BDF8";
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(width - 500, 0);
            ctx.bezierCurveTo(width - 280, 20, width - 80, 140, width, 100);
            ctx.lineTo(width, 0);
            ctx.closePath();
            ctx.fillStyle = "#0284C7";
            ctx.fill();
            ctx.restore();

            // 3. Corner Waves - Bottom Left
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(0, height - 600);
            ctx.bezierCurveTo(240, height - 420, 600, height - 100, 800, height);
            ctx.lineTo(0, height);
            ctx.closePath();
            ctx.fillStyle = "#0F3B66";
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(0, height - 450);
            ctx.bezierCurveTo(200, height - 320, 450, height - 80, 650, height);
            ctx.lineTo(0, height);
            ctx.closePath();
            ctx.fillStyle = "#2563EB";
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(0, height - 300);
            ctx.bezierCurveTo(140, height - 200, 320, height - 50, 480, height);
            ctx.lineTo(0, height);
            ctx.closePath();
            ctx.fillStyle = "#38BDF8";
            ctx.fill();
            ctx.restore();

            // 4. Outer decorative border
            const pad = 65;
            ctx.strokeStyle = "#1E3A8A";
            ctx.lineWidth = 3;
            ctx.strokeRect(pad, pad, width - pad * 2, height - pad * 2);

            // Corner L-brackets
            const cornerSize = 40;
            const cornerOffset = 50;
            ctx.strokeStyle = "#0F2942";
            ctx.lineWidth = 6;

            // Top-Left L
            ctx.beginPath();
            ctx.moveTo(cornerOffset, cornerOffset + cornerSize);
            ctx.lineTo(cornerOffset, cornerOffset);
            ctx.lineTo(cornerOffset + cornerSize, cornerOffset);
            ctx.stroke();

            // Top-Right L
            ctx.beginPath();
            ctx.moveTo(width - cornerOffset - cornerSize, cornerOffset);
            ctx.lineTo(width - cornerOffset, cornerOffset);
            ctx.lineTo(width - cornerOffset, cornerOffset + cornerSize);
            ctx.stroke();

            // Bottom-Left L
            ctx.beginPath();
            ctx.moveTo(cornerOffset, height - cornerOffset - cornerSize);
            ctx.lineTo(cornerOffset, height - cornerOffset);
            ctx.lineTo(cornerOffset + cornerSize, height - cornerOffset);
            ctx.stroke();

            // Bottom-Right L
            ctx.beginPath();
            ctx.moveTo(width - cornerOffset - cornerSize, height - cornerOffset);
            ctx.lineTo(width - cornerOffset, height - cornerOffset);
            ctx.lineTo(width - cornerOffset, height - cornerOffset - cornerSize);
            ctx.stroke();

            // 5. Logo & Brand (Top Left)
            const logoX = 140;
            const logoY = 130;
            ctx.fillStyle = "#0284C7";
            ctx.beginPath();
            ctx.arc(logoX + 45, logoY + 45, 42, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = "#FFFFFF";
            ctx.beginPath();
            ctx.moveTo(logoX + 45, logoY + 28);
            ctx.lineTo(logoX + 75, logoY + 42);
            ctx.lineTo(logoX + 45, logoY + 54);
            ctx.lineTo(logoX + 15, logoY + 42);
            ctx.closePath();
            ctx.fill();

            // Brand Text
            ctx.fillStyle = "#0C2340";
            ctx.font = "bold 44px 'Montserrat', sans-serif";
            ctx.textAlign = "left";
            ctx.fillText("Online Learning", logoX + 110, logoY + 42);

            ctx.fillStyle = "#0284C7";
            ctx.font = "bold 24px 'Montserrat', sans-serif";
            ctx.fillText("—  P L A T F O R M  —", logoX + 114, logoY + 76);

            // Tagline (Top Right)
            ctx.fillStyle = "#64748B";
            ctx.font = "500 24px 'Montserrat', sans-serif";
            ctx.textAlign = "right";
            ctx.fillText("Learn   •   Grow   •   Build Your Future", width - 140, logoY + 55);

            // 6. CERTIFICATE Heading
            ctx.textAlign = "center";
            ctx.fillStyle = "#0F2942";
            ctx.font = "bold 88px 'Montserrat', sans-serif";
            ctx.fillText("CERTIFICATE", width / 2, 430);

            // Subtitle: — OF COMPLETION —
            ctx.fillStyle = "#1D4ED8";
            ctx.font = "bold 38px 'Montserrat', sans-serif";
            const subText = "OF COMPLETION";
            ctx.fillText(subText, width / 2, 500);

            const subMetrics = ctx.measureText(subText);
            const lineGap = 40;
            const lineLen = 220;
            ctx.strokeStyle = "#1D4ED8";
            ctx.lineWidth = 3;

            ctx.beginPath();
            ctx.moveTo(width / 2 - subMetrics.width / 2 - lineGap - lineLen, 488);
            ctx.lineTo(width / 2 - subMetrics.width / 2 - lineGap, 488);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(width / 2 + subMetrics.width / 2 + lineGap, 488);
            ctx.lineTo(width / 2 + subMetrics.width / 2 + lineGap + lineLen, 488);
            ctx.stroke();

            // 7. Presentation text
            ctx.fillStyle = "#475569";
            ctx.font = "34px 'Montserrat', sans-serif";
            ctx.fillText("This certificate is proudly presented to", width / 2, 630);

            // 8. Recipient Name
            ctx.fillStyle = "#1E3A8A";
            ctx.font = "italic 400 115px 'Great Vibes', cursive, 'Playfair Display'";
            ctx.fillText(recipientName || "Student Name", width / 2, 790);

            // Underline
            ctx.strokeStyle = "#38BDF8";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(width / 2 - 500, 835);
            ctx.lineTo(width / 2 + 500, 835);
            ctx.stroke();

            // 9. Course text
            ctx.fillStyle = "#334155";
            ctx.font = "36px 'Montserrat', sans-serif";
            ctx.fillText("for successfully completing the course", width / 2, 920);

            ctx.fillStyle = "#0284C7";
            ctx.font = "bold 44px 'Montserrat', sans-serif";
            ctx.fillText(courseName || "Course Name", width / 2, 980);

            if (score) {
                ctx.fillStyle = "#047857";
                ctx.font = "bold 26px 'Montserrat', sans-serif";
                ctx.fillText(`Verified Assessment Score: ${score}% (Minimum 75% Criteria Met)`, width / 2, 1025);

                ctx.fillStyle = "#475569";
                ctx.font = "30px 'Montserrat', sans-serif";
                ctx.fillText(`on ${formattedDate}`, width / 2, 1070);
            } else {
                ctx.fillStyle = "#475569";
                ctx.font = "32px 'Montserrat', sans-serif";
                ctx.fillText(`on ${formattedDate}`, width / 2, 1050);
            }

            // 10. Seal
            const sealX = width / 2;
            const sealY = 1260;

            ctx.fillStyle = "#1D4ED8";
            ctx.beginPath();
            ctx.moveTo(sealX - 45, sealY + 20);
            ctx.lineTo(sealX - 65, sealY + 160);
            ctx.lineTo(sealX - 35, sealY + 140);
            ctx.lineTo(sealX - 5, sealY + 160);
            ctx.lineTo(sealX - 15, sealY + 20);
            ctx.closePath();
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(sealX + 15, sealY + 20);
            ctx.lineTo(sealX + 5, sealY + 160);
            ctx.lineTo(sealX + 35, sealY + 140);
            ctx.lineTo(sealX + 65, sealY + 160);
            ctx.lineTo(sealX + 45, sealY + 20);
            ctx.closePath();
            ctx.fill();

            const goldGrad = ctx.createRadialGradient(sealX - 20, sealY - 20, 10, sealX, sealY, 90);
            goldGrad.addColorStop(0, "#FDE68A");
            goldGrad.addColorStop(0.5, "#F59E0B");
            goldGrad.addColorStop(1, "#B45309");

            ctx.fillStyle = goldGrad;
            ctx.beginPath();
            ctx.arc(sealX, sealY, 82, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = "#FFFFFF";
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(sealX, sealY, 70, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = "#78350F";
            ctx.beginPath();
            ctx.moveTo(sealX, sealY - 28);
            ctx.lineTo(sealX + 38, sealY - 12);
            ctx.lineTo(sealX, sealY + 6);
            ctx.lineTo(sealX - 38, sealY - 12);
            ctx.closePath();
            ctx.fill();

            // 11. Signature
            const sigX = width - 420;
            const sigY = 1260;

            ctx.strokeStyle = "#1E3A8A";
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            ctx.moveTo(sigX - 100, sigY - 40);
            ctx.bezierCurveTo(sigX - 60, sigY - 110, sigX + 10, sigY - 20, sigX + 30, sigY - 80);
            ctx.bezierCurveTo(sigX + 60, sigY - 10, sigX + 110, sigY - 70, sigX + 150, sigY - 30);
            ctx.stroke();

            ctx.strokeStyle = "#38BDF8";
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(sigX - 140, sigY);
            ctx.lineTo(sigX + 170, sigY);
            ctx.stroke();

            ctx.fillStyle = "#0F2942";
            ctx.font = "bold 32px 'Montserrat', sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(instructorName, sigX + 15, sigY + 45);

            ctx.fillStyle = "#0284C7";
            ctx.font = "500 24px 'Montserrat', sans-serif";
            ctx.fillText(instructorTitle, sigX + 15, sigY + 80);

            // 12. Verification
            const idX = 260;
            const idY = 1260;
            ctx.textAlign = "left";
            ctx.fillStyle = "#0F2942";
            ctx.font = "bold 24px 'Montserrat', sans-serif";
            ctx.fillText("CERTIFICATE VERIFICATION", idX, idY + 20);

            ctx.fillStyle = "#475569";
            ctx.font = "20px 'Montserrat', sans-serif";
            ctx.fillText(`ID: ${certId}`, idX, idY + 52);
            ctx.fillText("Verified by Online Learning Platform", idX, idY + 80);

            const dataUrl = canvas.toDataURL("image/png");
            const link = document.createElement("a");
            const safeName = (courseName || "course").replace(/[^a-zA-Z0-9]/g, "_");
            link.download = `Certificate_${safeName}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Error generating canvas certificate:", error);
        }
    };

    return (
        <div className="flex flex-col items-center w-full">
            {/* Action Bar (Download) */}
            {showActions && (
                <div className="flex flex-wrap items-center justify-between w-full max-w-[1000px] mb-4 gap-3 bg-card p-3 rounded-xl border shadow-xs print:hidden">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        <span>Official Credential • ID: <strong className="text-foreground">{certId}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            onClick={handleDownloadPng}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                        >
                            <Download className="h-4 w-4" />
                            <span>Download Certificate (PNG)</span>
                        </Button>
                    </div>
                </div>
            )}

            {/* Certificate Container */}
            <div
                id="certificate-print-container"
                className={`relative w-full max-w-[1000px] aspect-[1.414/1] bg-white text-slate-800 shadow-2xl rounded-sm overflow-hidden select-none border border-slate-200 transition-all ${
                    compact ? 'scale-90 origin-top' : ''
                }`}
                style={{
                    backgroundColor: "#FFFFFF",
                    fontFamily: "var(--font-montserrat), sans-serif",
                    color: "#0F2942"
                }}
            >
                {/* 1. Top-Right Wave Vectors */}
                <div className="absolute top-0 right-0 w-[42%] h-[42%] pointer-events-none z-0">
                    <svg viewBox="0 0 420 300" className="w-full h-full" preserveAspectRatio="none">
                        <path d="M 0,0 Q 220,130 420,90 L 420,0 Z" fill="#0F3B66" />
                        <path d="M 80,0 Q 260,90 420,60 L 420,0 Z" fill="#38BDF8" />
                        <path d="M 180,0 Q 300,50 420,30 L 420,0 Z" fill="#0284C7" />
                    </svg>
                </div>

                {/* 2. Bottom-Left Wave Vectors */}
                <div className="absolute bottom-0 left-0 w-[42%] h-[42%] pointer-events-none z-0">
                    <svg viewBox="0 0 420 300" className="w-full h-full" preserveAspectRatio="none">
                        <path d="M 0,70 Q 150,150 420,300 L 0,300 Z" fill="#0F3B66" />
                        <path d="M 0,140 Q 180,210 330,300 L 0,300 Z" fill="#2563EB" />
                        <path d="M 0,210 Q 130,250 240,300 L 0,300 Z" fill="#38BDF8" />
                    </svg>
                </div>

                {/* 3. Decorative Outer Corner L-Brackets */}
                <div className="absolute top-4 left-4 w-6 h-6 border-t-[3px] border-l-[3px] border-[#0F2942]" />
                <div className="absolute top-4 right-4 w-6 h-6 border-t-[3px] border-r-[3px] border-[#0F2942]" />
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-[3px] border-l-[3px] border-[#0F2942]" />
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-[3px] border-r-[3px] border-[#0F2942]" />

                {/* 4. Elegant Thin Inner Border */}
                <div className="absolute inset-6 border border-[#1E3A8A]/70 pointer-events-none">
                    <div className="absolute -top-1 -left-1 w-2 h-2 bg-[#0F2942]" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-[#0F2942]" />
                    <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#0F2942]" />
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#0F2942]" />
                </div>

                {/* 5. Certificate Body Content */}
                <div className="relative z-10 h-full flex flex-col justify-between p-10 md:p-14">
                    {/* Header: Logo & Tagline */}
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 md:w-13 md:h-13 rounded-full bg-gradient-to-tr from-blue-700 to-sky-400 flex items-center justify-center shadow-md">
                                <Award className="w-6 h-6 md:w-7 md:h-7 text-white" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-extrabold text-xl md:text-2xl text-[#0C2340] tracking-tight leading-tight">
                                    Online Learning
                                </span>
                                <span className="text-[11px] md:text-xs font-bold text-[#0284C7] tracking-[0.25em] uppercase">
                                    — Platform —
                                </span>
                            </div>
                        </div>

                        <div className="text-right">
                            <span className="text-xs md:text-sm font-medium text-slate-500 tracking-wider">
                                Learn &bull; Grow &bull; Build Your Future
                            </span>
                        </div>
                    </div>

                    {/* Main Title & Subtitle */}
                    <div className="text-center my-auto py-2">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#0F2942] tracking-[0.12em] uppercase mb-1">
                            CERTIFICATE
                        </h1>

                        <div className="flex items-center justify-center gap-4 my-2">
                            <div className="h-[2px] w-16 md:w-32 bg-[#1D4ED8]" />
                            <h2 className="text-sm md:text-lg lg:text-xl font-bold text-[#1D4ED8] tracking-[0.2em] uppercase">
                                OF COMPLETION
                            </h2>
                            <div className="h-[2px] w-16 md:w-32 bg-[#1D4ED8]" />
                        </div>

                        <p className="text-slate-600 text-xs md:text-base font-normal mt-3 tracking-wide">
                            This certificate is proudly presented to
                        </p>

                        {/* Recipient Name in Cursive Script */}
                        <div className="my-2 md:my-3">
                            <h3
                                className="text-4xl md:text-6xl lg:text-7xl font-normal text-[#1E3A8A] font-script py-1"
                                style={{
                                    fontFamily: "var(--font-script), 'Great Vibes', 'Alex Brush', cursive",
                                }}
                            >
                                {recipientName || "Student Name"}
                            </h3>
                            <div className="h-[1.5px] w-3/5 max-w-[500px] mx-auto bg-[#38BDF8]" />
                        </div>

                        {/* Course & Completion Statement */}
                        <p className="text-slate-700 text-xs md:text-base font-normal mt-2">
                            for successfully completing the course
                        </p>
                        <h4 className="text-base md:text-xl lg:text-2xl font-bold text-[#0284C7] mt-0.5">
                            {courseName || "Course Name"}
                        </h4>

                        {score && (
                            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] md:text-xs font-semibold mt-1.5 shadow-2xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Verified Score: {score}% &bull; Minimum 75% Criteria Met</span>
                            </div>
                        )}

                        <p className="text-slate-500 text-xs md:text-sm font-medium mt-1">
                            on {formattedDate}
                        </p>
                    </div>

                    {/* Footer: Seal, Signatures, Verification */}
                    <div className="grid grid-cols-3 items-end pt-2">
                        {/* Left: Credential ID */}
                        <div className="text-left text-slate-500">
                            <div className="flex items-center gap-1.5 text-[#0F2942] font-bold text-[10px] md:text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>VERIFIED CREDENTIAL</span>
                            </div>
                            <p className="text-[9px] md:text-xs text-slate-500 font-mono mt-0.5">
                                {certId}
                            </p>
                            <p className="text-[8px] md:text-[10px] text-slate-400 hidden sm:block">
                                Secured via Online Learning Platform
                            </p>
                        </div>

                        {/* Center: Gold Medallion with Ribbon */}
                        <div className="flex flex-col items-center justify-center relative">
                            <div className="relative w-12 h-14 md:w-16 md:h-18">
                                <div className="absolute top-8 left-1.5 w-4 h-12 bg-[#1D4ED8] -rotate-12 shadow-sm [clip-path:polygon(0_0,100%_0,100%_100%,50%_80%,0_100%)]" />
                                <div className="absolute top-8 right-1.5 w-4 h-12 bg-[#1D4ED8] rotate-12 shadow-sm [clip-path:polygon(0_0,100%_0,100%_100%,50%_80%,0_100%)]" />
                                
                                <div className="relative z-10 w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 border-2 border-amber-300 shadow-lg flex items-center justify-center">
                                    <div className="w-9 h-9 md:w-12 md:h-12 rounded-full border border-amber-200/80 flex items-center justify-center bg-amber-500/20">
                                        <Award className="w-5 h-5 md:w-7 md:h-7 text-amber-950 drop-shadow-xs" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Signature */}
                        <div className="text-right">
                            <div className="inline-flex flex-col items-center">
                                <svg viewBox="0 0 160 50" className="w-24 md:w-32 h-8 md:h-10 text-[#1E3A8A]">
                                    <path
                                        d="M 10,35 Q 30,5 50,40 Q 70,10 90,30 Q 110,5 140,25"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                    <path
                                        d="M 35,25 Q 70,15 120,25"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="1.8"
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="h-[1.5px] w-28 md:w-40 bg-[#38BDF8]" />
                                <span className="font-bold text-[#0F2942] text-xs md:text-sm mt-1">
                                    {instructorName}
                                </span>
                                <span className="text-[10px] md:text-xs text-[#0284C7] font-medium">
                                    {instructorTitle}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
