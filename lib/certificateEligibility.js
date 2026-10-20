/**
 * Utility functions for evaluating Certificate Eligibility
 * Requirements:
 * 1. Complete all chapters in the course.
 * 2. Watch at least 70% of each chapter's video.
 * 3. Attend the 3-question quiz for each chapter in the course.
 * 4. Achieve a minimum combined score of 75% across all chapters.
 */

export const MIN_VIDEO_WATCH_PERCENTAGE = 70; // 70% of video duration per chapter
export const MIN_VIDEO_WATCH_SECONDS = 120; // Kept for backwards compatibility
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
 * Calculates max video watch duration in seconds across all videos (legacy helper).
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
 * Requirements:
 * 1. Complete all chapters in the course.
 * 2. Watch at least 70% of each chapter's video.
 * 3. Attend the 3-question quiz for each chapter in the course.
 * 4. Achieve a minimum combined score of 75% across all chapters.
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

    // 2. Video Watch Requirement Check: At least 70% of each chapter's video watched
    const videoProgress = targetEnroll?.videoProgress || {};
    const percentages = videoProgress?.percentages || {};
    const watchedSeconds = videoProgress?.watchedSeconds || {};
    const durations = videoProgress?.durations || {};
    const chapterVideos = videoProgress?.chapterVideos || {};
    const isGlobalVideoMet = videoProgress?.videoRequirementMet === true;

    let totalChaptersWithVideos = 0;
    let videoChaptersCompletedCount = 0;

    const chapterVideoDetails = allChapters.map((chapter) => {
        const videos = Array.isArray(chapter.youtubeVideo) ? chapter.youtubeVideo : [];
        const hasVideo = videos.length > 0;

        if (!hasVideo) {
            return {
                chapterKey: chapter.key,
                chapterIndex: chapter.chapterIndex,
                chapterTitle: chapter.chapterTitle,
                hasVideo: false,
                isCompleted: true,
                percentage: 100,
            };
        }

        totalChaptersWithVideos++;

        // If the whole video requirement is marked met (e.g. demo / completed flag)
        if (isGlobalVideoMet) {
            videoChaptersCompletedCount++;
            return {
                chapterKey: chapter.key,
                chapterIndex: chapter.chapterIndex,
                chapterTitle: chapter.chapterTitle,
                hasVideo: true,
                isCompleted: true,
                percentage: 100,
            };
        }

        // Check if chapter has explicit completion recorded
        const explicitRecord = chapterVideos[chapter.key] || chapterVideos[chapter.altKey] || chapterVideos[chapter.chapterTitle];
        if (explicitRecord?.isCompleted || Number(explicitRecord?.percentage) >= MIN_VIDEO_WATCH_PERCENTAGE) {
            videoChaptersCompletedCount++;
            return {
                chapterKey: chapter.key,
                chapterIndex: chapter.chapterIndex,
                chapterTitle: chapter.chapterTitle,
                hasVideo: true,
                isCompleted: true,
                percentage: Math.min(100, Math.max(MIN_VIDEO_WATCH_PERCENTAGE, Number(explicitRecord?.percentage) || 100)),
            };
        }

        // Check individual video IDs in the chapter
        let maxPctForChapter = 0;
        videos.forEach((vid) => {
            const vId = vid?.videoId || vid?.id?.videoId || vid?.id;
            if (!vId) return;

            let pct = 0;
            if (typeof percentages[vId] === 'number') {
                pct = percentages[vId];
            } else if (typeof watchedSeconds[vId] === 'number' && typeof durations[vId] === 'number' && durations[vId] > 0) {
                pct = Math.min(100, Math.round((watchedSeconds[vId] / durations[vId]) * 100));
            }
            if (pct > maxPctForChapter) {
                maxPctForChapter = pct;
            }
        });

        const isChapterVideoCompleted = maxPctForChapter >= MIN_VIDEO_WATCH_PERCENTAGE;
        if (isChapterVideoCompleted) {
            videoChaptersCompletedCount++;
        }

        return {
            chapterKey: chapter.key,
            chapterIndex: chapter.chapterIndex,
            chapterTitle: chapter.chapterTitle,
            hasVideo: true,
            isCompleted: isChapterVideoCompleted,
            percentage: maxPctForChapter,
        };
    });

    const isVideoRequirementMet = isGlobalVideoMet ||
        (totalChaptersWithVideos === 0) ||
        (totalChaptersWithVideos > 0 && videoChaptersCompletedCount >= totalChaptersWithVideos);

    const videoProgressPercentage = totalChaptersWithVideos > 0
        ? Math.min(100, Math.round((videoChaptersCompletedCount / totalChaptersWithVideos) * 100))
        : 100;

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
            title: 'Watch at least 70% of each chapter video',
            description: isVideoRequirementMet
                ? (totalChaptersWithVideos > 0
                    ? `All chapter videos completed (>= ${MIN_VIDEO_WATCH_PERCENTAGE}% watched)`
                    : 'Video requirement completed')
                : `${videoChaptersCompletedCount} of ${totalChaptersWithVideos} chapter videos watched (>= ${MIN_VIDEO_WATCH_PERCENTAGE}%)`,
            isCompleted: isVideoRequirementMet,
            progress: videoProgressPercentage,
            badge: isVideoRequirementMet
                ? `${MIN_VIDEO_WATCH_PERCENTAGE}% Watched ✓`
                : `${videoChaptersCompletedCount}/${totalChaptersWithVideos} Ch (70%)`,
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
        minVideoPercentage: MIN_VIDEO_WATCH_PERCENTAGE,
        videoChaptersCompletedCount,
        totalChaptersWithVideos,
        chapterVideoDetails,
        chaptersCompletedCount,
        totalChapters,
        attendedChaptersCount,
        chapterResults,
        checklist,
    };
}
