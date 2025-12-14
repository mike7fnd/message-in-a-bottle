
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

type MessageCardProps = {
  content: string;
  timestamp: string;
  className?: string;
  style?: React.CSSProperties;
};

const TRUNCATE_LENGTH = 150;

export function MessageCard({
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
    <Card className={className} style={style}>
      <CardContent className="relative p-6">
        <blockquote className="border-l-2 border-border pl-4 italic text-muted-foreground">
          {displayedContent}
        </blockquote>
        {isTruncated && (
          <>
            <div className="absolute bottom-6 right-6 left-6 h-16 bg-gradient-to-t from-card to-transparent pointer-events-none"></div>
            <div className="absolute bottom-6 right-6 flex items-center justify-end text-sm font-semibold text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              Read More <ArrowRight className="ml-1 h-4 w-4" />
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="p-6 pt-0">
        <p className="text-sm text-muted-foreground">Received {timestamp}</p>
      </CardFooter>
    </Card>
  );
}
