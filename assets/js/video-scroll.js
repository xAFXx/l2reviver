document.addEventListener('DOMContentLoaded', () => {
    const video = document.getElementById('bg-video');
    const container = document.querySelector('.video-container');

    if (!video) return;

    // We want to map the total scrollable height to the video duration
    let duration = 0;

    // Smooth scroll variables
    let targetTime = 0;
    let currentTime = 0;
    const lerpAmount = 0.1; // Adjust for smoothness (0.1 = smooth, 1 = instant)

    video.addEventListener('loadedmetadata', () => {
        duration = video.duration;
        updateVideo();
    });

    function updateVideo() {
        const scrollPosition = window.scrollY;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

        if (maxScroll <= 0) return;

        const scrollPercentage = Math.min(Math.max(scrollPosition / maxScroll, 0), 1);
        targetTime = scrollPercentage * duration;
    }

    function animate() {
        // Interpolate current time towards target time for smoothness
        currentTime += (targetTime - currentTime) * lerpAmount;

        // Apply to video
        if (video.readyState >= 2) { // HAVE_CURRENT_DATA or better
            video.currentTime = currentTime;
        }

        requestAnimationFrame(animate);
    }

    window.addEventListener('scroll', updateVideo, { passive: true });
    window.addEventListener('resize', updateVideo);

    // Initial call
    requestAnimationFrame(animate);
});
