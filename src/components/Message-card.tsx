import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

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
  const displayedContent =
    content.length > TRUNCATE_LENGTH
      ? `${content.substring(0, TRUNCATE_LENGTH)}...`
      : content;

  return (
    <Card className={className} style={style}>
      <CardContent className="relative p-6">
        <MessageSquare className="absolute -top-3 -left-3 h-8 w-8 text-muted" />
        <blockquote className="border-l-2 border-border pl-4 italic text-muted-foreground">
          {displayedContent}
        </blockquote>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4 p-6 pt-0">
        <p className="text-sm text-muted-foreground">Received {timestamp}</p>
      </CardFooter>
    </Card>
  );
}
