
import { AboutPageClient } from '@/components/AboutPageClient';
import { type Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
    const title = "About Message in a Bottle";
    const description = "Learn more about the project, leave feedback, and see what the community thinks.";

    return {
        title,
        description,
         openGraph: {
            title,
            description,
        },
        twitter: {
            title,
            description,
        },
    };
}

export default function AboutPage() {
    return <AboutPageClient />;
}
