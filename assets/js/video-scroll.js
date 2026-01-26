const { fromEvent, merge, animationFrames, map, scan, distinctUntilChanged, filter } = rxjs;

document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('bg-video');
    if (!video) return;

    let duration = 0;
    const lerpAmount = 0.08;
    let isSeeking = false;

    const getTargetTime = () => {
        const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
        const maxScroll = scrollHeight - window.innerHeight;
        if (maxScroll <= 0 || duration <= 0) return 0;
        return (scrollPosition / maxScroll) * duration;
    };

    video.addEventListener('seeking', () => { isSeeking = true; });
    video.addEventListener('seeked', () => { isSeeking = false; });

    if (video.duration && !isNaN(video.duration)) {
        duration = video.duration;
    }

    const metadata$ = fromEvent(video, 'loadedmetadata').pipe(map(() => video.duration));
    const scroll$ = fromEvent(window, 'scroll', { passive: true });
    const resize$ = fromEvent(window, 'resize');

    let targetTime = getTargetTime();

    merge(scroll$, resize$, metadata$).subscribe(() => {
        if (!duration && video.duration) duration = video.duration;
        targetTime = getTargetTime();
    });

    animationFrames().pipe(
        // Ensure metadata is ready
        filter(() => video.readyState >= 1 && duration > 0)
    ).subscribe(() => {
        const currentTime = video.currentTime;
        const diff = targetTime - currentTime;

        // Forward motion: Use native play() for maximum smoothness
        if (diff > 0.05) {
            // Adjust playbackRate based on distance to catch up
            // Scaling from 1x to 4x depending on how far we are
            const rate = Math.min(Math.max(diff * 5, 1), 4);
            video.playbackRate = rate;

            if (video.paused) {
                video.play().catch(() => { });
            }
        }
        // Backward motion or near target: Use seeking/Lerp
        else if (diff < -0.05) {
            video.pause();
            if (!isSeeking) {
                // Smoothly scrub backwards
                video.currentTime = currentTime + (diff * lerpAmount);
            }
        }
        // Very close to target: Maintain position
        else {
            if (!video.paused) {
                video.pause();
            }
            video.playbackRate = 1;
        }
    });

    video.load();
});
