// ============================================
// VOLI Website - Clean Rebuild
// Scroll-driven animations using Lenis + GSAP
// ============================================

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// ============================================
// Initialize on DOM load
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('VOLI website loaded - Initializing animations');

    // Wait for all images to load before starting animations
    // This prevents layout shifts when images finish loading
    const imagesToLoad = Array.from(document.images).filter(img => !img.complete);

    if (imagesToLoad.length === 0) {
        console.log('All images cached, starting immediately');
        initializeAnimations();
    } else {
        console.log(`Waiting for ${imagesToLoad.length} images...`);

        // Race between image loading and 3-second timeout
        Promise.race([
            Promise.all(imagesToLoad.map(img => new Promise(resolve => {
                img.onload = img.onerror = resolve;
            }))),
            new Promise(resolve => setTimeout(resolve, 3000))
        ]).then(() => {
            console.log('Images loaded, starting animations');
            initializeAnimations();
        });
    }
});

// ============================================
// Main animation initialization
// ============================================
function initializeAnimations() {

    // Initialize Lenis smooth scroll
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        smoothTouch: false,
        touchMultiplier: 2
    });

    // Sync Lenis with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);

    // Add Lenis to GSAP ticker for perfect sync
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });

    // Disable lag smoothing for consistent performance
    gsap.ticker.lagSmoothing(0);

    // ============================================
    // Set initial states
    // ============================================

    // Position all feature titles at top, scaled down
    gsap.set(['.fantasy-title', '.stats-title', '.games-title', '.more-title'], {
        y: -350,
        scale: 0.7
    });

    // Calculate responsive screenshot positions
    const isMobile = window.innerWidth <= 768;
    const leftPos = isMobile ? -100 : -350;
    const rightPos = isMobile ? 100 : 350;

    // ============================================
    // Master Timeline
    // Everything is controlled by scroll position
    // ============================================

    const masterTimeline = gsap.timeline({
        scrollTrigger: {
            trigger: '#scroll-spacer',
            start: 'top top',
            end: 'bottom bottom',
            scrub: 1,
            markers: false,
            anticipatePin: 1,
            invalidateOnRefresh: true
        }
    });

    // ============================================
    // Phase 1: Hero fade out
    // ============================================

    masterTimeline.to(['.hero-logo', '.hero-tagline', '.scroll-indicator'], {
        opacity: 0,
        y: -30,
        ease: 'power2.inOut',
        duration: 1
    }, 0);

    masterTimeline.to('.hero-background', {
        opacity: 0,
        ease: 'power2.inOut',
        duration: 1
    }, 0);

    // ============================================
    // Phase 2: FANTASY section
    // ============================================

    // Fade in FANTASY title
    masterTimeline.to('.fantasy-title', {
        opacity: 1,
        ease: 'power2.inOut',
        duration: 1
    }, 1);

    // Get all screenshot wrappers
    const screenshotWrappers = gsap.utils.toArray('.screenshot-wrapper');

    // Set initial state - all fantasy screenshots start off-screen right
    screenshotWrappers.forEach((wrapper) => {
        gsap.set(wrapper.querySelector('.fantasy-screenshot'), {
            x: '100vw',
            rotation: 0,
            scale: 1
        });
    });

    // Fantasy screenshots slide in from right to final positions
    // Left screenshot
    masterTimeline.to(screenshotWrappers[0].querySelector('.fantasy-screenshot'), {
        x: leftPos,
        rotation: -8,
        scale: 0.85,
        ease: 'power2.inOut',
        duration: 2
    }, '>');

    // Center screenshot
    masterTimeline.to(screenshotWrappers[1].querySelector('.fantasy-screenshot'), {
        x: 0,
        rotation: 0,
        scale: 1,
        ease: 'power2.inOut',
        duration: 2
    }, '>-1');

    // Right screenshot
    masterTimeline.to(screenshotWrappers[2].querySelector('.fantasy-screenshot'), {
        x: rightPos,
        rotation: 8,
        scale: 0.85,
        ease: 'power2.inOut',
        duration: 2
    }, '>-1');

    // Fade in fantasy text after screenshots settle
    masterTimeline.to('.fantasy-text', {
        opacity: 1,
        y: -300,
        ease: 'power2.out',
        duration: 1.5
    }, '>-0.5');

    // ============================================
    // Phase 3: FANTASY → STATS transition
    // ============================================

    // Fade out FANTASY title
    masterTimeline.to('.fantasy-title', {
        opacity: 0,
        ease: 'power2.inOut',
        duration: 0.8
    }, '>+3');

    // Fade in STATS title (simultaneous)
    masterTimeline.to('.stats-title', {
        opacity: 1,
        ease: 'power2.inOut',
        duration: 0.8
    }, '<');

    // Move fantasy screenshots off screen left
    const fantasyScreenshots = gsap.utils.toArray('.fantasy-screenshot');
    masterTimeline.to(fantasyScreenshots, {
        x: '-100vw',
        opacity: 0,
        ease: 'power2.inOut',
        duration: 1.5,
        stagger: 0.1
    }, '<');

    // Swap text
    masterTimeline.to('.fantasy-text', {
        opacity: 0,
        ease: 'power2.inOut',
        duration: 0.8
    }, '<');

    masterTimeline.to('.stats-text', {
        opacity: 1,
        y: -300,
        ease: 'power2.out',
        duration: 0.8
    }, '<');

    // ============================================
    // Phase 4: STATS section
    // ============================================

    // Set initial states for stats screenshots
    const statsScreenshots = gsap.utils.toArray('.stats-screenshot');
    statsScreenshots.forEach((screenshot) => {
        gsap.set(screenshot, {
            x: '100vw',
            rotation: 0,
            scale: 1,
            opacity: 1
        });
    });

    // Stats screenshots slide in from right to final positions
    // Left screenshot
    masterTimeline.to(statsScreenshots[0], {
        x: leftPos,
        rotation: -8,
        scale: 0.85,
        ease: 'power2.inOut',
        duration: 2
    }, '>');

    // Center screenshot
    masterTimeline.to(statsScreenshots[1], {
        x: 0,
        rotation: 0,
        scale: 1,
        ease: 'power2.inOut',
        duration: 2
    }, '>-1');

    // Right screenshot
    masterTimeline.to(statsScreenshots[2], {
        x: rightPos,
        rotation: 8,
        scale: 0.85,
        ease: 'power2.inOut',
        duration: 2
    }, '>-1');

    // ============================================
    // Phase 5: STATS → GAMES transition
    // ============================================

    // Fade out STATS title
    masterTimeline.to('.stats-title', {
        opacity: 0,
        ease: 'power2.inOut',
        duration: 0.8
    }, '>+3');

    // Fade in GAMES title (simultaneous)
    masterTimeline.to('.games-title', {
        opacity: 1,
        ease: 'power2.inOut',
        duration: 0.8
    }, '<');

    // Move stats screenshots off screen left
    masterTimeline.to(statsScreenshots, {
        x: '-100vw',
        opacity: 0,
        ease: 'power2.inOut',
        duration: 1.5,
        stagger: 0.1
    }, '<');

    // Swap text
    masterTimeline.to('.stats-text', {
        opacity: 0,
        ease: 'power2.inOut',
        duration: 0.8
    }, '<');

    masterTimeline.to('.games-text', {
        opacity: 1,
        y: -300,
        ease: 'power2.out',
        duration: 0.8
    }, '<');

    // ============================================
    // Phase 6: GAMES section
    // ============================================

    // Set initial states for games screenshots
    const gamesScreenshots = gsap.utils.toArray('.games-screenshot');
    gamesScreenshots.forEach((screenshot) => {
        gsap.set(screenshot, {
            x: '100vw',
            rotation: 0,
            scale: 1,
            opacity: 1
        });
    });

    // Games screenshots slide in from right to final positions
    // Left screenshot
    masterTimeline.to(gamesScreenshots[0], {
        x: leftPos,
        rotation: -8,
        scale: 0.85,
        ease: 'power2.inOut',
        duration: 2
    }, '>');

    // Center screenshot
    masterTimeline.to(gamesScreenshots[1], {
        x: 0,
        rotation: 0,
        scale: 1,
        ease: 'power2.inOut',
        duration: 2
    }, '>-1');

    // Right screenshot
    masterTimeline.to(gamesScreenshots[2], {
        x: rightPos,
        rotation: 8,
        scale: 0.85,
        ease: 'power2.inOut',
        duration: 2
    }, '>-1');

    // ============================================
    // Phase 7: GAMES → MORE transition
    // ============================================

    // Fade out GAMES title
    masterTimeline.to('.games-title', {
        opacity: 0,
        ease: 'power2.inOut',
        duration: 0.8
    }, '>+3');

    // Fade in MORE title (simultaneous)
    masterTimeline.to('.more-title', {
        opacity: 1,
        ease: 'power2.inOut',
        duration: 0.8
    }, '<');

    // Move games screenshots off screen left
    masterTimeline.to(gamesScreenshots, {
        x: '-100vw',
        opacity: 0,
        ease: 'power2.inOut',
        duration: 1.5,
        stagger: 0.1
    }, '<');

    // Swap text
    masterTimeline.to('.games-text', {
        opacity: 0,
        ease: 'power2.inOut',
        duration: 0.8
    }, '<');

    masterTimeline.to('.more-text', {
        opacity: 1,
        y: -300,
        ease: 'power2.out',
        duration: 0.8
    }, '<');

    // ============================================
    // Phase 8: MORE section
    // ============================================

    // Set initial states for more screenshots
    const moreScreenshots = gsap.utils.toArray('.more-screenshot');
    moreScreenshots.forEach((screenshot) => {
        gsap.set(screenshot, {
            x: '100vw',
            rotation: 0,
            scale: 1,
            opacity: 1
        });
    });

    // More screenshots slide in from right to final positions
    // Left screenshot
    masterTimeline.to(moreScreenshots[0], {
        x: leftPos,
        rotation: -8,
        scale: 0.85,
        ease: 'power2.inOut',
        duration: 2
    }, '>');

    // Center screenshot
    masterTimeline.to(moreScreenshots[1], {
        x: 0,
        rotation: 0,
        scale: 1,
        ease: 'power2.inOut',
        duration: 2
    }, '>-1');

    // Right screenshot
    masterTimeline.to(moreScreenshots[2], {
        x: rightPos,
        rotation: 8,
        scale: 0.85,
        ease: 'power2.inOut',
        duration: 2
    }, '>-1');

    // ============================================
    // Phase 9: Footer slides up
    // ============================================

    // Fade out MORE title and text
    masterTimeline.to('.more-title', {
        opacity: 0,
        ease: 'power2.inOut',
        duration: 1
    }, '>+3');

    masterTimeline.to('.more-text', {
        opacity: 0,
        ease: 'power2.inOut',
        duration: 1
    }, '<');

    // Move screenshots to final positions (slightly down)
    masterTimeline.to(moreScreenshots, {
        y: 100,
        ease: 'power2.inOut',
        duration: 1.5
    }, '<');

    // Bring back logo only (no tagline)
    masterTimeline.to('.hero-logo', {
        opacity: 1,
        y: -280,
        ease: 'power2.out',
        duration: 1.5
    }, '<0.3');

    // Move download buttons up above logo
    masterTimeline.to('.fixed-download-buttons', {
        y: -515,
        ease: 'power2.out',
        duration: 1.5
    }, '<0.2');

    // Slide footer up
    masterTimeline.to('.footer', {
        y: 0,
        opacity: 1,
        ease: 'power2.out',
        duration: 1.5
    }, '<');

    // Debug output
    console.log('=== TIMELINE DEBUG ===');
    console.log('Timeline totalDuration:', masterTimeline.totalDuration());
    console.log('ScrollTrigger end value:', masterTimeline.scrollTrigger.end);
    console.log('This timeline should fill the scroll range proportionally');

    // ============================================
    // 3D Parallax effect on feature titles
    // ============================================

    const fantasyTitle = document.querySelector('.fantasy-title');

    document.addEventListener('mousemove', (e) => {
        // Get cursor position relative to center of viewport
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;

        // Calculate rotation (max 8 degrees)
        const rotateY = (mouseX / centerX) * 8;
        const rotateX = (mouseY / centerY) * -8; // Inverted for natural tilt

        // Apply to fantasy title
        gsap.to(fantasyTitle, {
            rotateX: rotateX,
            rotateY: rotateY,
            duration: 0.5,
            ease: 'power2.out',
            overwrite: 'auto'
        });
    });

    console.log('Animations initialized successfully');
}
