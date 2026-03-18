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

/**
 * Stagger child — use variants on a stagger parent.
 * Parent: initial="hidden" whileInView="visible" viewport={{ once: true, margin: '-80px' }}
 *         transition={{ staggerChildren: 0.06 }}
 * Child:  variants={staggerChild.variants}
 */
export const staggerChild = {
    variants: {
        hidden: { opacity: 0, y: 24 },
        visible: {
            opacity: 1, y: 0,
            transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
        },
    },
};

/**
 * Fade up — individual scroll-triggered element.
 * Usage: <motion.div {...fadeUp}>...</motion.div>
 */
export const fadeUp = {
    initial: { opacity: 0, y: 12 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-80px' },
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] as const },
};
