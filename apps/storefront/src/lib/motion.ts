/**
 * Trovestak motion primitives — Apple standard
 * Three primitives only. Use these everywhere. Add nothing else.
 */

/**
 * Scroll reveal — everything below the fold.
 * Usage: <motion.div {...scrollReveal}>...</motion.div>
 */
export const scrollReveal = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-100px' },
    transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] as const },
};

/**
 * Hover lift — product cards only.
 * Usage: <motion.div {...hoverLift}>...</motion.div>
 */
export const hoverLift = {
    whileHover: { scale: 1.03 },
    transition: { duration: 0.3 },
};

/**
 * Page transition — wrap page content inside AnimatePresence.
 * Usage: <motion.div {...pageTransition}>...</motion.div>
 */
export const pageTransition = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2 },
};
