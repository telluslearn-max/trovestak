export type ThemeMode = 'default' | 'launch' | 'holiday' | 'back-to-school' | 'black-friday' | 'jamhuri';

export type HomepageTheme = {
    mode: ThemeMode;
    palette: 'dark' | 'light';
    name: string;
    banner?: {
        message: string;
        deadline?: Date;
        bg: string;
        text: string;
    };
    hero?: {
        eyebrow?: string;
        primaryCta?: string;
        secondaryCta?: string;
    };
    bento?: {
        label?: string;
        priorityCategories?: string[];
    };
    accentColor?: string;
};

const THEMES: Record<string, HomepageTheme> = {
    launch: {
        mode: 'launch',
        palette: 'dark',
        name: 'Product Launch',
        hero: { primaryCta: 'Order now', secondaryCta: 'Learn more' },
    },
    holiday_christmas: {
        mode: 'holiday',
        palette: 'dark',
        name: 'Christmas',
        banner: {
            message: 'Order by Dec 21 for free delivery before Christmas.',
            deadline: new Date('2025-12-21T23:59:59'),
            bg: 'bg-red-700',
            text: 'text-white',
        },
        hero: { eyebrow: 'The perfect gift', primaryCta: 'Shop Gifts', secondaryCta: 'See all gifts' },
        bento: { label: 'Top Gifts', priorityCategories: ['wireless-earbuds', 'wearables', 'smart-home'] },
        accentColor: '#C0392B',
    },
    back_to_school: {
        mode: 'back-to-school',
        palette: 'light',
        name: 'Back to School',
        banner: {
            message: 'Students: Buy any laptop, get AirPods at 20% off.',
            bg: 'bg-[#0071E3]',
            text: 'text-white',
        },
        hero: { eyebrow: 'Built for students', primaryCta: 'Shop bundles', secondaryCta: 'Learn more' },
        bento: { label: 'Back to School Picks', priorityCategories: ['computing', 'tablets', 'wireless-earbuds'] },
    },
    black_friday: {
        mode: 'black-friday',
        palette: 'dark',
        name: 'Black Friday',
        banner: {
            message: 'Black Friday: Deals end Sunday.',
            deadline: new Date('2025-12-01T23:59:59'),
            bg: 'bg-black',
            text: 'text-white',
        },
        bento: { label: 'Black Friday Deals' },
        accentColor: '#FF3B30',
    },
    jamhuri: {
        mode: 'jamhuri',
        palette: 'dark',
        name: 'Jamhuri Day',
        hero: { eyebrow: 'Proudly Kenyan', primaryCta: 'Shop now', secondaryCta: 'Our story' },
        accentColor: '#006600',
    },
};

export function getActiveTheme(): HomepageTheme {
    const override = process.env.HOMEPAGE_THEME as string | undefined;
    if (override && THEMES[override]) return THEMES[override];

    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    if (month === 12 && day === 12) return THEMES.jamhuri;
    if (month === 12 && day >= 10 && day <= 26) return THEMES.holiday_christmas;
    if (month === 11 && day >= 24) return THEMES.black_friday;
    if (month === 1 && day <= 20) return THEMES.back_to_school;

    return { mode: 'default', palette: 'dark', name: 'Default' };
}
