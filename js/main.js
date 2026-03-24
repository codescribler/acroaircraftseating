/**
 * ACRO AIRCRAFT SEATING — PREMIUM DEMO SITE
 * Main JavaScript file for interactions and animations
 */

/* ============================================================================
   DOM ELEMENT REFERENCES
   ============================================================================ */
const demoModal = document.getElementById('demoModal');
const navbar = document.getElementById('navbar');
const closeModalBtn = demoModal?.querySelector('button[aria-label="Close modal"]');
const modalBackdrop = demoModal?.querySelector('.absolute.inset-0');
const ctaButtons = document.querySelectorAll('.cta-button');

/* ============================================================================
   MODAL FUNCTIONALITY
   ============================================================================ */

/**
 * Open the demo modal
 */
function openModal() {
    if (!demoModal) return;
    demoModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    demoModal.focus();
    // Focus the first button in the modal
    const firstButton = demoModal.querySelector('a');
    if (firstButton) firstButton.focus();
}

/**
 * Close the demo modal
 */
function closeModal() {
    if (!demoModal) return;
    demoModal.classList.add('hidden');
    document.body.style.overflow = '';
}

/**
 * Attach event listeners to CTA buttons
 */
function attachModalListeners() {
    ctaButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
    });

    // Close button
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }

    // Backdrop click closes modal
    if (modalBackdrop) {
        modalBackdrop.addEventListener('click', closeModal);
    }

    // Escape key closes modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && demoModal && !demoModal.classList.contains('hidden')) {
            closeModal();
        }
    });
}

/**
 * Focus trap within modal
 */
function setupModalFocusTrap() {
    if (!demoModal) return;

    const focusableElements = demoModal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    demoModal.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;

        if (e.shiftKey) {
            if (document.activeElement === firstElement) {
                lastElement.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === lastElement) {
                firstElement.focus();
                e.preventDefault();
            }
        }
    });
}

/* ============================================================================
   SCROLL REVEAL ANIMATION
   ============================================================================ */

/**
 * Intersection Observer for scroll reveal animations
 */
function setupScrollReveal() {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Unobserve after revealing (performance optimization)
                    observer.unobserve(entry.target);
                }
            });
        },
        {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        }
    );

    // Observe all elements with reveal-on-scroll class
    document.querySelectorAll('.reveal-on-scroll').forEach(el => {
        observer.observe(el);
    });
}

/* ============================================================================
   NAVBAR SCROLL SHADOW
   ============================================================================ */

/**
 * Add shadow to navbar on scroll for depth
 */
function setupNavbarScrollEffect() {
    if (!navbar) return;

    const handleScroll = () => {
        if (window.scrollY > 5) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
}

/* ============================================================================
   SMOOTH SCROLL ANCHOR LINKS
   ============================================================================ */

/**
 * Handle smooth scrolling for anchor links
 */
function setupAnchorLinks() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#' || href === '#main') return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

/* ============================================================================
   BUTTON RIPPLE EFFECT
   ============================================================================ */

/**
 * Add ripple effect to CTA buttons on click
 */
function setupButtonRipple() {
    ctaButtons.forEach(button => {
        button.addEventListener('click', function (e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const ripple = document.createElement('span');
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';

            // The ripple animation is handled by CSS ::before pseudo-element
            // This is just ensuring the button receives the click event properly
        });
    });
}

/* ============================================================================
   PERFORMANCE: LAZY LOAD IMAGES
   ============================================================================ */

/**
 * Lazy load images using native loading attribute
 */
function setupLazyLoading() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        if (!img.hasAttribute('loading')) {
            img.setAttribute('loading', 'lazy');
        }
    });
}

/* ============================================================================
   ACCESSIBILITY: KEYBOARD NAVIGATION
   ============================================================================ */

/**
 * Enhance keyboard navigation
 */
function setupKeyboardNav() {
    // Skip to main content link functionality
    const skipLink = document.querySelector('.skip-to-content');
    if (skipLink) {
        skipLink.addEventListener('click', (e) => {
            e.preventDefault();
            const mainContent = document.getElementById('main');
            if (mainContent) {
                mainContent.focus();
                mainContent.scrollIntoView({ behavior: 'smooth' });
            }
        });
    }
}

/* ============================================================================
   SCROLL-LINKED VIDEO HERO
   ============================================================================ */

/**
 * Tie a video's currentTime to scroll position using a smooth
 * lerp (linear interpolation) loop. Instead of jumping directly to
 * the target frame on every scroll event (which causes jank), we
 * run a continuous rAF loop that eases toward the target time.
 *
 * On DESKTOP: the video lives inside the hero section (scroll-linked hero).
 * On MOBILE: the hero is static; a separate mobile-only section below
 *            the hero contains the video and provides the scroll distance.
 */
function setupScrollLinkedVideo() {
    const isMobile = window.innerWidth < 768;

    if (isMobile) {
        setupMobileScrollVideo();
    } else {
        setupDesktopScrollVideo();
    }
}

/**
 * DESKTOP: scroll-linked video inside the hero section (original behavior)
 */
function setupDesktopScrollVideo() {
    const heroSection = document.getElementById('hero');
    const video = document.getElementById('heroVideo');
    const heroContent = heroSection?.querySelector('.hero-content');
    const scrollHint = heroSection?.querySelector('.hero-scroll-hint');

    if (!heroSection || !video) return;

    let videoDuration = 0;
    let targetTime = 0;
    let currentTime = 0;
    let animating = true;

    const LERP_FACTOR = 0.5;
    const EPSILON = 0.001;

    function onMetadataReady() {
        videoDuration = video.duration;
        video.currentTime = 0;
        currentTime = 0;
        video.classList.remove('opacity-0');
        video.classList.add('opacity-100');
    }

    if (video.readyState >= 2) {
        onMetadataReady();
    } else {
        video.addEventListener('loadeddata', onMetadataReady);
    }

    function getScrollProgress() {
        const rect = heroSection.getBoundingClientRect();
        const sectionHeight = heroSection.offsetHeight;
        const viewportHeight = window.innerHeight;
        const scrollableDistance = sectionHeight - viewportHeight;
        const scrolled = -rect.top;
        return Math.max(0, Math.min(1, scrolled / scrollableDistance));
    }

    function tick() {
        if (!animating || !videoDuration) {
            requestAnimationFrame(tick);
            return;
        }

        const scrollProgress = getScrollProgress();
        targetTime = scrollProgress * videoDuration;

        const delta = targetTime - currentTime;
        if (Math.abs(delta) > EPSILON) {
            currentTime += delta * LERP_FACTOR;
            video.currentTime = currentTime;
        } else {
            currentTime = targetTime;
        }

        // Fade out hero text
        if (heroContent) {
            const textFade = 1 - Math.max(0, Math.min(1, (scrollProgress - 0.08) / 0.3));
            heroContent.style.opacity = textFade;
        }

        // Hide scroll hint after any scroll
        if (scrollHint) {
            if (scrollProgress > 0.01) {
                heroSection.classList.add('scrolled-past');
            } else {
                heroSection.classList.remove('scrolled-past');
            }
        }

        requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);

    document.addEventListener('visibilitychange', () => {
        animating = !document.hidden;
    });
}

/**
 * MOBILE: autoplay video in a dedicated section below the hero.
 *
 * iOS Safari blocks frame-level scrubbing via currentTime, so instead
 * we autoplay the video (muted + playsinline) and use IntersectionObserver
 * to play when visible and pause when off-screen. The sticky container
 * keeps the video pinned in view while the user scrolls through the section.
 */
function setupMobileScrollVideo() {
    const section = document.getElementById('mobileVideoSection');
    const video = document.getElementById('mobileHeroVideo');

    if (!section || !video) return;

    // Use IntersectionObserver to play/pause based on visibility
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    video.play().catch(() => {
                        // Autoplay blocked — will start on first user gesture
                    });
                } else {
                    video.pause();
                }
            });
        },
        { threshold: 0.25 }
    );

    observer.observe(section);

    // Pause when tab is hidden
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            video.pause();
        }
    });
}

/* ============================================================================
   ANIMATION STAGGER FOR HERO ELEMENTS
   ============================================================================ */

/**
 * Stagger animations for hero section elements
 */
function setupHeroAnimations() {
    const heroSection = document.querySelector('.hero-section');
    if (!heroSection) return;

    const animatedElements = heroSection.querySelectorAll('[style*="animation-delay"]');
    animatedElements.forEach(el => {
        // Ensure animations are applied
        el.style.animation = el.style.animation || 'fadeInUp 0.8s ease-out forwards';
    });
}

/* ============================================================================
   PREFERS REDUCED MOTION SUPPORT
   ============================================================================ */

/**
 * Check and respect user's motion preferences
 */
function setupMotionPreferences() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
        // Remove all animations by adding a class
        document.documentElement.style.setProperty('--animation-duration', '0.01ms');
    }
}

/* ============================================================================
   INITIALIZATION
   ============================================================================ */

/**
 * Initialize all features
 */
function init() {
    // Modal
    attachModalListeners();
    setupModalFocusTrap();

    // Scroll animations
    setupScrollReveal();
    setupNavbarScrollEffect();

    // Navigation
    setupAnchorLinks();

    // Interactions
    setupButtonRipple();

    // Performance
    setupLazyLoading();

    // Accessibility
    setupKeyboardNav();
    setupMotionPreferences();

    // Hero animations & scroll-linked video
    setupHeroAnimations();
    setupScrollLinkedVideo();

    // Log initialization in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('Acro demo site initialized successfully');
    }
}

/* ============================================================================
   DOM READY & INITIALIZATION
   ============================================================================ */

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOM is already loaded
    init();
}

/* ============================================================================
   WINDOW RESIZE HANDLER
   ============================================================================ */

/**
 * Handle window resize for responsive behavior
 */
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        // Re-setup scroll reveal in case layout changed
        setupScrollReveal();
    }, 250);
}, { passive: true });

/* ============================================================================
   PAGE VISIBILITY API
   ============================================================================ */

/**
 * Handle page visibility changes (tab switching)
 */
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // Page is hidden
        if (demoModal && !demoModal.classList.contains('hidden')) {
            closeModal();
        }
    }
});

/* ============================================================================
   UTILITY FUNCTIONS
   ============================================================================ */

/**
 * Scroll to element smoothly
 */
function scrollToElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/**
 * Get all visible elements in viewport
 */
function getVisibleElements(className) {
    const elements = document.querySelectorAll(className);
    const visible = [];

    elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            visible.push(el);
        }
    });

    return visible;
}

/* ============================================================================
   END OF MAIN.JS
   ============================================================================ */
