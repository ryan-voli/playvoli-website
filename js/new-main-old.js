// VOLI New Website - Lenis + GSAP Animations

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

// Prevent mobile address bar from causing viewport jumps
ScrollTrigger.normalizeScroll(true);

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    console.log('VOLI website loaded - Initializing Lenis + GSAP');

    // Wait for all images to load before calculating positions (with timeout fallback)
    const imagesToLoad = Array.from(document.images).filter(img => !img.complete);

    if (imagesToLoad.length === 0) {
        // All images already loaded (cached)
        console.log('All images already loaded, starting animations immediately');
        initializeAnimations();
    } else {
        console.log(`Waiting for ${imagesToLoad.length} images to load...`);

        // Race between image loading and 3 second timeout
        Promise.race([
            Promise.all(
                imagesToLoad.map(img => new Promise(resolve => {
                    img.onload = img.onerror = resolve;
                }))
            ),
            new Promise(resolve => setTimeout(resolve, 3000))
        ]).then(() => {
            console.log('Images loaded (or timed out), starting animations');
            initializeAnimations();
        });
    }
});

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

    // Disable lag smoothing
    gsap.ticker.lagSmoothing(0);

    // Set initial states for all titles (positioned at top)
    gsap.set(['.fantasy-title', '.stats-title', '.games-title'], {
        y: -350,
        scale: 0.7
    });

    // Master timeline - everything happens in fixed viewport driven by scroll
    const masterTimeline = gsap.timeline({
        scrollTrigger: {
            trigger: 'body',
            start: 'top top',
            end: '+=2000vh', // Doubled scroll distance for slower animations
            scrub: 1,
            markers: false,
            anticipatePin: 1, // Accounts for mobile browser chrome
            invalidateOnRefresh: true // Recalculates on viewport resize
        }
    });

    // Phase 1: Hero fades out (0-20% of scroll)
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

    // Phase 2: FANTASY title fades in (already positioned at top)
    masterTimeline.to('.fantasy-title', {
        opacity: 1,
        ease: 'power2.inOut',
        duration: 1
    }, 1);

    // Get carousel items
    const carouselItems = gsap.utils.toArray('.carousel-item');

    // Set initial state - images start way off to the right (no rotation)
    carouselItems.forEach((item) => {
        gsap.set(item.querySelector('.fantasy-screenshot'), {
            x: '100vw',
            rotation: 0,
            scale: 1
        });
    });

    // Phase 3: Images slide in from right to their final positions
    // Calculate responsive positions based on viewport width
    const isMobile = window.innerWidth <= 768;
    const leftPos = isMobile ? -100 : -350;
    const rightPos = isMobile ? 100 : 350;

    // Fantasy1 -> left
    masterTimeline.to(carouselItems[0].querySelector('.fantasy-screenshot'), {
        x: leftPos,
        rotation: -8,
        scale: 0.85,
        ease: 'power2.inOut',
        duration: 2
    }, '>');

    // Fantasy2 -> center (0px)
    masterTimeline.to(carouselItems[1].querySelector('.fantasy-screenshot'), {
        x: 0,
        rotation: 0,
        scale: 1,
        ease: 'power2.inOut',
        duration: 2
    }, '>-1');

    // Fantasy3 -> right
    masterTimeline.to(carouselItems[2].querySelector('.fantasy-screenshot'), {
        x: rightPos,
        rotation: 8,
        scale: 0.85,
        ease: 'power2.inOut',
        duration: 2
    }, '>-1');

    // Fade in fantasy explainer after images settle
    masterTimeline.to('.fantasy-text', {
        opacity: 1,
        y: -380,
        ease: 'power2.out',
        duration: 1.5
    }, '>-0.5');

    // Transition from FANTASY to STATS - Simple crossfade
    // Fade out FANTASY title
    masterTimeline.to('.fantasy-title', {
        opacity: 0,
        ease: 'power2.inOut',
        duration: 0.8
    }, '>2');

    // Fade in STATS title
    masterTimeline.to('.stats-title', {
        opacity: 1,
        ease: 'power2.inOut',
        duration: 0.8
    }, '<');

    // Move fantasy screenshots off screen to the left
    const fantasyScreenshots = gsap.utils.toArray('.fantasy-screenshot');
    masterTimeline.to(fantasyScreenshots, {
        x: '-100vw',
        opacity: 0,
        ease: 'power2.inOut',
        duration: 1.5,
        stagger: 0.1
    }, '<');

    // Fade out fantasy text and fade in stats text
    masterTimeline.to('.fantasy-text', {
        opacity: 0,
        ease: 'power2.inOut',
        duration: 0.8
    }, '<');

    masterTimeline.to('.stats-text', {
        opacity: 1,
        y: -380,
        ease: 'power2.out',
        duration: 0.8
    }, '<');

    // Set initial states for stats and games screenshots
    const statsScreenshots = gsap.utils.toArray('.stats-screenshot');
    const gamesScreenshots = gsap.utils.toArray('.games-screenshot');

    statsScreenshots.forEach((item) => {
        gsap.set(item, {
            x: '100vw',
            rotation: 0,
            scale: 1,
            opacity: 1
        });
    });

    gamesScreenshots.forEach((item) => {
        gsap.set(item, {
            x: '100vw',
            rotation: 0,
            scale: 1,
            opacity: 1
        });
    });

    // Stats screenshots slide in from right to their final positions
    // Stats1 -> left
    masterTimeline.to(statsScreenshots[0], {
        x: leftPos,
        rotation: -8,
        scale: 0.85,
        ease: 'power2.inOut',
        duration: 2
    }, '>');

    // Stats2 -> center (0px)
    masterTimeline.to(statsScreenshots[1], {
        x: 0,
        rotation: 0,
        scale: 1,
        ease: 'power2.inOut',
        duration: 2
    }, '>-1');

    // Stats3 -> right
    masterTimeline.to(statsScreenshots[2], {
        x: rightPos,
        rotation: 8,
        scale: 0.85,
        ease: 'power2.inOut',
        duration: 2
    }, '>-1');

    // Transition from STATS to GAMES - Simple crossfade
    masterTimeline.to('.stats-title', {
        opacity: 0,
        ease: 'power2.inOut',
        duration: 0.8
    }, '>2');

    masterTimeline.to('.games-title', {
        opacity: 1,
        ease: 'power2.inOut',
        duration: 0.8
    }, '<');

    masterTimeline.to(statsScreenshots, {
        x: '-100vw',
        opacity: 0,
        ease: 'power2.inOut',
        duration: 1.5,
        stagger: 0.1
    }, '<');

    masterTimeline.to('.stats-text', {
        opacity: 0,
        ease: 'power2.inOut',
        duration: 0.8
    }, '<');

    masterTimeline.to('.games-text', {
        opacity: 1,
        y: -380,
        ease: 'power2.out',
        duration: 0.8
    }, '<');

    // Games screenshots slide in from right to their final positions
    // Games1 -> left
    masterTimeline.to(gamesScreenshots[0], {
        x: leftPos,
        rotation: -8,
        scale: 0.85,
        ease: 'power2.inOut',
        duration: 2
    }, '>');

    // Games2 -> center (0px)
    masterTimeline.to(gamesScreenshots[1], {
        x: 0,
        rotation: 0,
        scale: 1,
        ease: 'power2.inOut',
        duration: 2
    }, '>-1');

    // Games3 -> right
    masterTimeline.to(gamesScreenshots[2], {
        x: rightPos,
        rotation: 8,
        scale: 0.85,
        ease: 'power2.inOut',
        duration: 2
    }, '>-1');

    // 3D Parallax effect on FANTASY title
    const fantasyTitle = document.querySelector('.fantasy-title');

    document.addEventListener('mousemove', (e) => {
        // Get cursor position relative to center of viewport
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;

        // Calculate rotation based on cursor distance from center
        const rotateY = (mouseX / centerX) * 8; // Max 8 degrees rotation
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

    console.log('Lenis + GSAP initialized successfully');
}
