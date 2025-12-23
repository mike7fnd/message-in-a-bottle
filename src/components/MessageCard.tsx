
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import { memo } from 'react';

type MessageCardProps = {
  content: string;
  timestamp: string;
  className?: string;
  style?: React.CSSProperties;
};

const TRUNCATE_LENGTH = 150;

function MessageCardInternal({
  content,
  timestamp,
  className,
  style,
}: MessageCardProps) {
  const isTruncated = content.length > TRUNCATE_LENGTH;
  const displayedContent = isTruncated
    ? `${content.substring(0, TRUNCATE_LENGTH)}...`
    : content;

  return (
    <Card
      className={className}
      style={{
        ...style,
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 23px, hsl(var(--border) / 0.2) 24px, hsl(var(--border) / 0.2) 24px)'
      }}
    >
      <CardContent className="relative p-6">
        <blockquote className="border-l-2 border-red-800/10 pl-4 italic text-card-foreground/80">
          {displayedContent}
        </blockquote>
        {isTruncated && (
          <>
            <div
              className="absolute bottom-6 right-6 left-6 h-16 bg-gradient-to-t from-card to-transparent pointer-events-none"
            ></div>
            <div className="absolute bottom-6 right-6 flex items-center justify-end text-sm font-semibold text-card-foreground opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              Read More <ArrowRight className="ml-1 h-4 w-4" />
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-end p-6 pt-0">
        <p className="text-sm text-card-foreground/60">{timestamp}</p>
      </CardFooter>
    </Card>
  );
}

export const MessageCard = memo(MessageCardInternal);
