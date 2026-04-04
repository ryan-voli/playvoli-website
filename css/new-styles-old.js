/* VOLI New Website Styles */

:root {
    /* Brand Colors */
    --lemon-lime: #C8FF00;
    --electric-blue: #00d4ff;
    --rose: #FF1F6D;
    --eerie-black: #121212;
    --dark-bg: #131819;
    --dark-surface: #1f2629;
    --text-primary: #ffffff;
    --text-secondary: #dddddd;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html.lenis,
html.lenis body {
    height: auto;
}

.lenis.lenis-smooth {
    scroll-behavior: auto !important;
}

.lenis.lenis-smooth [data-lenis-prevent] {
    overscroll-behavior: contain;
}

.lenis.lenis-stopped {
    overflow: hidden;
}

.lenis.lenis-smooth iframe {
    pointer-events: none;
}

html {
    overflow-x: hidden;
}

body {
    font-family: 'Axiforma', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    background-color: var(--dark-bg);
    color: var(--text-primary);
    overflow-x: hidden;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    margin: 0;
    padding: 0;
}

/* Sections Container - fixed viewport */
#sections-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
}

/* Scroll Spacer - creates scroll height without visible scrolling */
#scroll-spacer {
    height: 2000vh;
    pointer-events: none;
}

/* Section Layout */
.section {
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    top: 0;
    left: 0;
    overflow: hidden;
}

/* Hero Section */
#hero {
    background: var(--dark-bg);
    flex-direction: column;
}

/* Section Title */
.section-title {
    font-size: clamp(4rem, 10vw, 8rem);
    font-weight: 900;
    letter-spacing: -0.02em;
    color: var(--lemon-lime);
    margin: 0;
    text-align: center;
}

/* Fantasy Title Fixed */
.fantasy-title-fixed {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1;
    transform-style: preserve-3d;
    perspective: 1000px;
    display: flex;
    justify-content: center;
    width: 100%;
    text-align: center;
}

.fantasy-title-fixed .letter {
    display: inline-block;
    will-change: transform, opacity;
    flex-shrink: 0;
}

/* Clone letters start hidden with no space */
.fantasy-title-fixed .letter-s-clone,
.fantasy-title-fixed .letter-t-clone {
    opacity: 0;
    width: 0;
    margin: 0;
    padding: 0;
    overflow: hidden;
}

/* Fantasy Explainer */
.fantasy-explainer {
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    font-size: clamp(0.875rem, 2vw, 1.125rem);
    font-weight: 400;
    color: var(--text-secondary);
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    margin-top: 80px;
    z-index: 1;
    opacity: 0;
    letter-spacing: 0.02em;
    text-align: center;
    max-width: 90%;
}

/* Fantasy Carousel Section (Horizontal Scroll) */
#fantasy-carousel {
    background: var(--dark-bg);
    height: 100vh;
    overflow: hidden;
}

.carousel-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    overflow: hidden;
    position: relative;
    z-index: 2;
}

.carousel-track {
    display: flex;
    gap: 2rem;
    will-change: transform;
    padding: 0 50vw;
}

.carousel-item {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
}

.fantasy-screenshot,
.stats-screenshot,
.games-screenshot {
    max-width: 280px;
    width: 90vw;
    height: auto;
    will-change: transform;
    filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.5));
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
}

/* Fantasy, Stats, and Games titles all positioned the same */
.fantasy-title,
.stats-title,
.games-title {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1;
    transform-style: preserve-3d;
    perspective: 1000px;
    display: flex;
    justify-content: center;
    width: 100%;
    text-align: center;
}

.hero-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: none;
    background-repeat: no-repeat;
    background-position: center center;
    background-size: cover;
    opacity: 0.5;
    z-index: 0;
    pointer-events: none;
}

.hero-logo {
    width: 300px;
    max-width: 80vw;
    height: auto;
    margin-bottom: 2rem;
    z-index: 2;
    position: relative;
}

.hero-tagline {
    font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    font-size: clamp(1.25rem, 3vw, 2rem);
    font-weight: 300;
    color: #ffffff;
    margin: 0 0 4rem 0;
    letter-spacing: 0.05em;
    z-index: 2;
    position: relative;
}

/* Scroll Indicator */
.scroll-indicator {
    position: absolute;
    bottom: 150px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-secondary);
    z-index: 2;
}

.scroll-indicator svg {
    color: var(--electric-blue);
}

.scroll-indicator p {
    font-size: 0.875rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-weight: 500;
}

.scroll-dot {
    animation: scrollBounce 2s ease-in-out infinite;
}

/* Fixed Download Buttons */
.fixed-download-buttons {
    position: fixed;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: row;
    gap: 0.5rem;
    z-index: 1000;
    max-width: 95vw;
}

.app-store-button,
.play-store-button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 14px;
    background-color: var(--dark-surface);
    border-radius: 12px;
    text-decoration: none;
    transition: transform 0.2s, opacity 0.2s, box-shadow 0.2s;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    cursor: pointer;
    flex: 1 1 0;
    min-width: 0;
    width: 180px;
}

.app-store-button:link,
.app-store-button:visited,
.app-store-button:hover,
.app-store-button:active,
.play-store-button:link,
.play-store-button:visited,
.play-store-button:hover,
.play-store-button:active {
    text-decoration: none;
}

.btn-text {
    display: flex;
    flex-direction: column;
    text-align: left;
    text-decoration: none;
}

.btn-subtitle {
    color: white;
    font-size: 10px;
    font-weight: 400;
    opacity: 0.8;
    text-decoration: none;
    white-space: nowrap;
}

.btn-title {
    color: white;
    font-size: 18px;
    font-weight: 600;
    line-height: 1;
    text-decoration: none;
    white-space: nowrap;
}

.app-store-button:hover,
.play-store-button:hover {
    transform: scale(1.05);
    opacity: 0.9;
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
}

/* Animations */
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes scrollBounce {
    0%, 100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(10px);
    }
}

/* Responsive */
@media (max-width: 768px) {
    .hero-logo {
        width: 200px;
        margin-bottom: 1.5rem;
    }

    .hero-tagline {
        margin-bottom: 3rem;
        font-size: 2rem;
    }

    .scroll-indicator {
        bottom: 180px;
    }

    .fixed-download-buttons {
        bottom: 30px;
    }

    .app-store-button,
    .play-store-button {
        width: 165px;
    }

    .app-store-button svg,
    .play-store-button svg {
        width: 28px;
        height: 28px;
    }

    .btn-subtitle {
        font-size: 9px;
    }

    .btn-title {
        font-size: 16px;
    }

    .fantasy-screenshot,
    .stats-screenshot,
    .games-screenshot {
        max-width: 250px;
    }
}

@media (max-width: 430px) {
    .fixed-download-buttons {
        gap: 0.3rem;
    }

    .app-store-button,
    .play-store-button {
        padding: 8px 10px;
        gap: 6px;
        width: 145px;
    }

    .app-store-button svg,
    .play-store-button svg {
        width: 24px;
        height: 24px;
    }

    .btn-subtitle {
        font-size: 8px;
    }

    .btn-title {
        font-size: 14px;
    }
}

@media (max-width: 375px) {
    .fixed-download-buttons {
        gap: 0.25rem;
    }

    .app-store-button,
    .play-store-button {
        padding: 8px 8px;
        gap: 5px;
        width: 135px;
    }

    .app-store-button svg,
    .play-store-button svg {
        width: 22px;
        height: 22px;
    }

    .btn-subtitle {
        font-size: 7px;
    }

    .btn-title {
        font-size: 13px;
    }
}
