"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useUser, UserButton } from "@clerk/nextjs";
import {
  Sparkles,
  ArrowRight,
  Zap,
  PlayCircle,
  Trophy,
  Compass,
  CheckCircle2,
  Mail,
  Menu,
  X,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { isSignedIn } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/ai_learning_logo_only.svg" alt="Logo" width={34} height={34} priority />
            <span className="font-extrabold text-base tracking-tight">Online Learning Platform</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground font-medium">
            <a href="#home" className="hover:text-foreground">Home</a>
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
            <a href="#contact" className="hover:text-foreground">Contact</a>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {isSignedIn ? (
              <div className="flex items-center gap-3">
                <Link href="/workspace">
                  <Button size="sm" className="gap-2 font-semibold">
                    <Compass className="h-4 w-4" /> Go to Workspace
                  </Button>
                </Link>
                <UserButton />
              </div>
            ) : (
              <>
                <Link href="/sign-in">
                  <Button variant="ghost" size="sm">Sign In</Button>
                </Link>
                <Link href="/sign-up">
                  <Button size="sm" className="gap-1.5 font-semibold">
                    Get Started <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 text-muted-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-b border-border bg-background px-4 py-4 flex flex-col gap-3 text-sm">
            <a href="#home" onClick={() => setMobileMenuOpen(false)}>Home</a>
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <a href="#contact" onClick={() => setMobileMenuOpen(false)}>Contact</a>
            <div className="pt-2 flex flex-col gap-2">
              {isSignedIn ? (
                <Link href="/workspace" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">Go to Workspace</Button>
                </Link>
              ) : (
                <>
                  <Link href="/sign-in" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">Sign In</Button>
                  </Link>
                  <Link href="/sign-up" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="home" className="pt-16 pb-16 text-center max-w-4xl mx-auto px-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-semibold mb-6">
          <Sparkles className="h-3.5 w-3.5" /> AI Powered Learning
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
          Create & Master Any Course in Seconds with AI
        </h1>

        <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
          Generate structured course layouts, video lessons, and interactive chapters instantly tailored to your goals.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          {isSignedIn ? (
            <Link href="/workspace">
              <Button size="lg" className="gap-2 font-semibold">
                Go to Workspace <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Link href="/sign-up">
              <Button size="lg" className="gap-2 font-semibold">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <Link href="/workspace/explore">
            <Button size="lg" variant="outline">Explore Courses</Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 border-t border-border bg-muted/20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-10">Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="p-5 rounded-xl border border-border bg-card">
              <Zap className="h-6 w-6 text-primary mb-3" />
              <h3 className="font-semibold text-base mb-1">Instant AI Layouts</h3>
              <p className="text-xs text-muted-foreground">Generates structured chapters, duration estimates, and topics automatically.</p>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card">
              <PlayCircle className="h-6 w-6 text-indigo-500 mb-3" />
              <h3 className="font-semibold text-base mb-1">Video Lessons</h3>
              <p className="text-xs text-muted-foreground">Curates relevant video content for each chapter of your course.</p>
            </div>

            <div className="p-5 rounded-xl border border-border bg-card">
              <Trophy className="h-6 w-6 text-purple-500 mb-3" />
              <h3 className="font-semibold text-base mb-1">Progress Tracking</h3>
              <p className="text-xs text-muted-foreground">Track completed chapters and visualize your progress in real time.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 max-w-4xl mx-auto px-4 w-full">
        <h2 className="text-2xl font-bold text-center mb-10">Simple Pricing</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl border border-border bg-card flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-lg mb-1">Free Plan</h3>
              <p className="text-3xl font-extrabold mb-4">$0</p>
              <ul className="space-y-2 text-xs text-muted-foreground mb-6">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> 1 AI Course Creation Limit</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Access Video Lessons & Notes</li>
              </ul>
            </div>
            <Link href={isSignedIn ? "/workspace" : "/sign-up"}>
              <Button variant="outline" className="w-full" size="sm">Get Started Free</Button>
            </Link>
          </div>

          <div className="p-6 rounded-xl border-2 border-primary bg-card flex flex-col justify-between shadow-sm">
            <div>
              <h3 className="font-bold text-lg mb-1">Starter Plan</h3>
              <p className="text-3xl font-extrabold mb-4">$9.99<span className="text-xs text-muted-foreground font-normal">/mo</span></p>
              <ul className="space-y-2 text-xs text-muted-foreground mb-6">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Unlimited AI Course Creation</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Fast Gemini AI Generation</li>
              </ul>
            </div>
            <Link href={isSignedIn ? "/workspace/billing" : "/sign-up"}>
              <Button className="w-full" size="sm">Upgrade to Starter</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-16 border-t border-border bg-muted/20">
        <div className="max-w-xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-2">Contact Us</h2>
          <p className="text-xs text-muted-foreground mb-6">Have questions or feedback? Send us a quick message.</p>

          {submitted ? (
            <p className="text-sm font-semibold text-emerald-600">Thank you! We received your message.</p>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="flex flex-col gap-3 text-left">
              <input required type="email" placeholder="Your Email" className="px-3 py-2 rounded-md border border-input text-sm bg-background" />
              <textarea required rows={3} placeholder="Message" className="px-3 py-2 rounded-md border border-input text-sm bg-background resize-none" />
              <Button type="submit" size="sm" className="gap-2 self-end">
                <Send className="h-3.5 w-3.5" /> Send
              </Button>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-xs text-muted-foreground mt-auto">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Image src="/ai_learning_logo_only.svg" alt="Logo" width={24} height={24} />
            <span className="font-semibold text-foreground">Online Learning Platform</span>
          </div>
          <p>© {new Date().getFullYear()} Online Learning Platform using AI.</p>
        </div>
      </footer>
    </div>
  );
}
