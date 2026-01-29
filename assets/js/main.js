window.CONFIG = {
    links: {
        discord: "https://discord.gg/74SBkBPCFe",
        telegram: "https://t.me/L2Reviver",
        support: "https://t.me/L2ReviverSupport",
        email: "mailto:support@l2reviver.com"
    },
    donation: {
        usdt_trc20: "TExexampleAddressPlaceholder12345"
    }
};
const { fromEvent, merge, animationFrames, map, scan, distinctUntilChanged, filter, tap } = rxjs;

document.addEventListener('DOMContentLoaded', () => {
    const videoForward = document.getElementById('bg-video-forward');
    const videoBackward = document.getElementById('bg-video-backward');

    if (!videoForward || !videoBackward) return;

    let forwardDuration = 0;
    let backwardDuration = 0;
    const lerpAmount = 0.08;

    let currentDir = 'forward'; // 'forward' or 'backward'
    let lastScrollY = window.pageYOffset || document.documentElement.scrollTop;

    const getScrollPercent = () => {
        const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
        const maxScroll = scrollHeight - window.innerHeight;
        return maxScroll > 0 ? Math.min(Math.max(scrollPosition / maxScroll, 0), 1) : 0;
    };

    const updateDurations = () => {
        if (videoForward.duration) forwardDuration = videoForward.duration;
        if (videoBackward.duration) backwardDuration = videoBackward.duration;
    };

    const scroll$ = fromEvent(window, 'scroll', { passive: true });
    const resize$ = fromEvent(window, 'resize');
    const metaF$ = fromEvent(videoForward, 'loadedmetadata');
    const metaB$ = fromEvent(videoBackward, 'loadedmetadata');

    let targetPercent = getScrollPercent();

    merge(scroll$, resize$, metaF$, metaB$).subscribe(() => {
        updateDurations();
        const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;

        // Detect direction
        if (currentScrollY > lastScrollY) {
            currentDir = 'forward';
        } else if (currentScrollY < lastScrollY) {
            currentDir = 'backward';
        }
        lastScrollY = currentScrollY;
        targetPercent = getScrollPercent();

        // Switch active video classes
        if (currentDir === 'forward') {
            videoForward.classList.add('active');
            videoBackward.classList.remove('active');
        } else {
            videoBackward.classList.add('active');
            videoForward.classList.remove('active');
        }
    });

    // Animation frame stream for syncing
    animationFrames().pipe(
        filter(() => forwardDuration > 0 && backwardDuration > 0)
    ).subscribe(() => {
        // Calculate target times for both videos
        // Forward: 0 to duration
        // Backward: duration to 0 (assuming reverse file starts with end frame at 0s)
        const targetTimeF = targetPercent * forwardDuration;
        const targetTimeB = (1 - targetPercent) * backwardDuration;

        const activeVideo = currentDir === 'forward' ? videoForward : videoBackward;
        const inactiveVideo = currentDir === 'forward' ? videoBackward : videoForward;
        const activeTargetTime = currentDir === 'forward' ? targetTimeF : targetTimeB;
        const inactiveTargetTime = currentDir === 'forward' ? targetTimeB : targetTimeF;

        // Update active video
        const diff = activeTargetTime - activeVideo.currentTime;
        if (Math.abs(diff) > 0.05) {
            if (diff > 0) {
                // Moving forward in the current video's timeline
                const rate = Math.min(Math.max(diff * 5, 1), 5);
                activeVideo.playbackRate = rate;
                if (activeVideo.paused) activeVideo.play().catch(() => { });
            } else {
                // This shouldn't happen much with two videos, but just in case
                activeVideo.pause();
                activeVideo.currentTime = activeVideo.currentTime + diff * lerpAmount;
            }
        } else {
            if (!activeVideo.paused) activeVideo.pause();
            activeVideo.playbackRate = 1;
        }

        // Keep inactive video in sync (seeking is fine here since it's hidden)
        if (Math.abs(inactiveVideo.currentTime - inactiveTargetTime) > 0.1) {
            inactiveVideo.currentTime = inactiveTargetTime;
        }
    });

    videoForward.load();
    videoBackward.load();
});
