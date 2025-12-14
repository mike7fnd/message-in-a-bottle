import { Card, CardContent, CardFooter } from '@/components/ui/card';

type MessageCardProps = {
  content: string;
  timestamp: string;
  className?: string;
  style?: React.CSSProperties;
};

export function MessageCard({
  content,
  timestamp,
  className,
  style,
}: MessageCardProps) {
  return (
    <Card className={className} style={style}>
      <CardContent className="relative p-6 pt-0">
        <blockquote className="border-l-2 border-border pl-4 italic text-muted-foreground">
          {content}
        </blockquote>
      </CardContent>
      <CardFooter className="p-6 pt-0 text-sm text-muted-foreground">
        <p>Received {timestamp}</p>
      </CardFooter>
    </Card>
  );
}
