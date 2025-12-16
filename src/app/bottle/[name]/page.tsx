
import { BottlePageClient } from '@/components/BottlePageClient';
import { type Metadata } from 'next';

type Props = {
    params: { name: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const recipientName = decodeURIComponent(params.name);
    const capitalizedName = recipientName.charAt(0).toUpperCase() + recipientName.slice(1);

    return {
        title: `Messages for ${capitalizedName}`,
        description: `Read all the anonymous messages sent to ${capitalizedName}.`,
         openGraph: {
            title: `Messages for ${capitalizedName}`,
            description: `A collection of messages for ${capitalizedName}.`,
        },
        twitter: {
            title: `Messages for ${capitalizedName}`,
            description: `A collection of messages for ${capitalizedName}.`,
        },
    };
}

export default function BottlePage({ params }: Props) {
    return <BottlePageClient params={params} />;
}
