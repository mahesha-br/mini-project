/**
 * Utility functions for evaluating Certificate Eligibility
 * Requirements:
 * 1. Complete all chapters in the course.
 * 2. Watch at least one course video for at least 2 minutes (120 seconds).
 * 3. Attend the 3-question quiz for each chapter in the course.
 * 4. Achieve a minimum combined score of 75% across all chapters.
 */

export const MIN_VIDEO_WATCH_SECONDS = 120; // 2 minutes
export const MIN_PASSING_PERCENTAGE = 75; // 75%
export const QUESTIONS_PER_CHAPTER = 3; // 3 questions per chapter

/**
 * Extracts a normalized list of all chapters in the course.
 */
export function extractAllChapters(course) {
    if (!course) return [];

    const chapters = course?.courseContent?.length
        ? course.courseContent
        : (course?.courseJson?.course?.chapters || []);

    return chapters.map((chapter, chapterIndex) => {
        const chapterTitle = chapter?.chapterName || chapter?.title || `Chapter ${chapterIndex + 1}`;
        const rawTopics = chapter?.content?.topics
            || chapter?.courseData?.topics
            || chapter?.topics
            || [];

        return {
            key: `chapter_${chapterIndex}`,
            altKey: `ch_${chapterIndex}`,
            chapterIndex,
            chapterTitle,
            topics: rawTopics,
            youtubeVideo: chapter?.youtubeVideo || []
        };
    });
}

/**
 * Legacy helper for backwards compatibility if needed.
 */
export function extractAllTopics(course) {
    const chapters = extractAllChapters(course);
    const topicsList = [];

    chapters.forEach((chapter) => {
        chapter.topics.forEach((t, topicIndex) => {
            const topicTitle = typeof t === 'string'
                ? t
                : (t?.topic || t?.topics || t?.topicName || t?.title || `Topic ${topicIndex + 1}`);

            topicsList.push({
                key: `ch_${chapter.chapterIndex}_topic_${topicIndex}`,
                chapterIndex: chapter.chapterIndex,
                chapterTitle: chapter.chapterTitle,
                topicIndex,
                title: topicTitle,
            });
        });
    });

    return topicsList;
}

/**
 * Calculates max video watch duration in seconds across all videos.
 */
export function getMaxVideoWatchedSeconds(videoProgress) {
    if (!videoProgress) return 0;
    if (typeof videoProgress === 'number') return videoProgress;

    if (videoProgress.videoRequirementMet) return MIN_VIDEO_WATCH_SECONDS;

    let maxSecs = 0;
    if (typeof videoProgress.maxWatchedSeconds === 'number') {
        maxSecs = Math.max(maxSecs, videoProgress.maxWatchedSeconds);
    }

    const dict = videoProgress.watchedSeconds || videoProgress;
    if (dict && typeof dict === 'object') {
        Object.values(dict).forEach((val) => {
            if (typeof val === 'number') {
                maxSecs = Math.max(maxSecs, Math.floor(val));
            } else if (val && typeof val.seconds === 'number') {
                maxSecs = Math.max(maxSecs, Math.floor(val.seconds));
            }
        });
    }

    return maxSecs;
}

/**
 * Comprehensive evaluation of student's progress and certificate eligibility.
 */
export function evaluateCertificateEligibility(course, enrollCourse) {
    const targetCourse = course?.courses || course?.course || course;
    const targetEnroll = enrollCourse || course?.enrollCourse || targetCourse?.enrollCourse;

    const allChapters = extractAllChapters(targetCourse);
    const totalChapters = allChapters.length > 0
        ? allChapters.length
        : (targetCourse?.noOfChapters || 1);

    // 1. Chapters Completion Check
    const completedChapters = Array.isArray(targetEnroll?.completedChapters)
        ? targetEnroll.completedChapters
        : (Array.isArray(targetEnroll?.completedChapter) ? targetEnroll.completedChapter : []);

    const chaptersCompletedCount = completedChapters.length;
    const isChaptersCompleted = totalChapters > 0 && chaptersCompletedCount >= totalChapters;
    const chaptersPercentage = Math.min(100, Math.round((chaptersCompletedCount / totalChapters) * 100));

    // 2. Video Watch Requirement Check (at least 1 video >= 2 minutes / 120s)
    const videoProgress = targetEnroll?.videoProgress || {};
    const maxWatchedSeconds = getMaxVideoWatchedSeconds(videoProgress);
    const isVideoRequirementMet = maxWatchedSeconds >= MIN_VIDEO_WATCH_SECONDS || videoProgress?.videoRequirementMet === true;
    const videoProgressPercentage = Math.min(100, Math.round((Math.min(maxWatchedSeconds, MIN_VIDEO_WATCH_SECONDS) / MIN_VIDEO_WATCH_SECONDS) * 100));

    // 3. Chapter Quizzes (3 questions per chapter) & 4. 75% Combined Score Check
    const quizScores = targetEnroll?.quizScores || {};

    let attendedChaptersCount = 0;
    let totalQuestionsAnswered = 0;
    let totalCorrectAnswers = 0;
    let sumPercentages = 0;

    const chapterResults = allChapters.map((chapter) => {
        // Look up by chapter_0 or ch_0 or title
        const scoreData = quizScores[chapter.key] || quizScores[chapter.altKey] || quizScores[chapter.chapterTitle];
        const isAttended = !!scoreData && (typeof scoreData.score === 'number' || typeof scoreData.percentage === 'number');

        if (isAttended) {
            attendedChaptersCount++;
            const score = Number(scoreData.score) || 0;
            const total = Number(scoreData.total) || QUESTIONS_PER_CHAPTER;
            const percentage = typeof scoreData.percentage === 'number'
                ? scoreData.percentage
                : Math.round((score / total) * 100);

            totalCorrectAnswers += score;
            totalQuestionsAnswered += total;
            sumPercentages += percentage;

            return {
                ...chapter,
                isAttended: true,
                score,
                total,
                percentage,
                passed: percentage >= MIN_PASSING_PERCENTAGE,
            };
        }

        return {
            ...chapter,
            isAttended: false,
            score: 0,
            total: QUESTIONS_PER_CHAPTER,
            percentage: 0,
            passed: false,
        };
    });

    const isAllChaptersAttended = totalChapters > 0
        ? attendedChaptersCount >= totalChapters
        : true;

    // Combined Score: calculated from total correct answers / total questions across all combined chapters
    const overallScore = attendedChaptersCount > 0
        ? (totalQuestionsAnswered > 0
            ? Math.round((totalCorrectAnswers / totalQuestionsAnswered) * 100)
            : Math.round(sumPercentages / attendedChaptersCount))
        : 0;

    const isScorePassed = overallScore >= MIN_PASSING_PERCENTAGE;

    // Overall Eligibility (all 4 criteria met)
    const isEligible = isChaptersCompleted && isVideoRequirementMet && isAllChaptersAttended && isScorePassed;

    // Checklist array for clear UI rendering
    const checklist = [
        {
            id: 'chapters',
            title: 'Complete All Chapters',
            description: `${chaptersCompletedCount} of ${totalChapters} chapters marked complete`,
            isCompleted: isChaptersCompleted,
            progress: chaptersPercentage,
            badge: isChaptersCompleted ? 'Completed' : `${chaptersCompletedCount}/${totalChapters}`,
        },
        {
            id: 'video',
            title: 'Watch at least 1 Video for 2 Minutes',
            description: isVideoRequirementMet
                ? 'Video requirement completed (>= 2:00 mins watched)'
                : `Watched ${Math.floor(maxWatchedSeconds / 60)}m ${(maxWatchedSeconds % 60).toString().padStart(2, '0')}s / 2m 00s on a video`,
            isCompleted: isVideoRequirementMet,
            progress: videoProgressPercentage,
            badge: isVideoRequirementMet ? '2m Watched' : `${Math.floor(maxWatchedSeconds / 60)}m ${maxWatchedSeconds % 60}s / 2m`,
        },
        {
            id: 'quizzes',
            title: 'Attend Chapter Quiz (3 Questions Each)',
            description: totalChapters > 0
                ? `${attendedChaptersCount} of ${totalChapters} chapter quizzes completed`
                : 'No chapters found',
            isCompleted: isAllChaptersAttended,
            progress: totalChapters > 0 ? Math.min(100, Math.round((attendedChaptersCount / totalChapters) * 100)) : 100,
            badge: `${attendedChaptersCount}/${totalChapters} Chapters`,
        },
        {
            id: 'score',
            title: 'Minimum 75% Combined Score Across All Chapters',
            description: isAllChaptersAttended
                ? (isScorePassed
                    ? `Combined Score: ${overallScore}% (Passed >= ${MIN_PASSING_PERCENTAGE}%)`
                    : `Combined Score: ${overallScore}% (Needs at least ${MIN_PASSING_PERCENTAGE}%)`)
                : `Current Combined: ${overallScore}% (Complete all ${totalChapters} chapter quizzes)`,
            isCompleted: isAllChaptersAttended && isScorePassed,
            progress: Math.min(100, overallScore),
            badge: `${overallScore}% / 75% Min`,
        },
    ];

    return {
        isEligible,
        isChaptersCompleted,
        isVideoRequirementMet,
        isAllChaptersAttended,
        isScorePassed,
        overallScore,
        minPassingScore: MIN_PASSING_PERCENTAGE,
        maxWatchedSeconds,
        minVideoSeconds: MIN_VIDEO_WATCH_SECONDS,
        chaptersCompletedCount,
        totalChapters,
        attendedChaptersCount,
        chapterResults,
        checklist,
    };
}
