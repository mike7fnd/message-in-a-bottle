
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowRight, Star } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { type Message } from '@/lib/data';
import { cn } from '@/lib/utils';
import { useFavorites } from '@/context/FavoritesContext';
import { Button } from './ui/button';

type MessageCardProps = {
  message: Message;
  className?: string;
  style?: React.CSSProperties;
};

export function MessageCard({
  message,
  className,
  style,
}: MessageCardProps) {
  const { content, timestamp, openTimestamp, recipient } = message;
  const { isFavorite, toggleFavorite } = useFavorites();
  
  const favorite = isFavorite(message.id);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(message);
  }

  const openDate = openTimestamp ? new Date(openTimestamp.seconds * 1000) : null;
  const isLocked = openDate && openDate > new Date();

  const formattedTimestamp = timestamp
    ? format(new Date(timestamp), "MMMM d, yyyy 'at' h:mm a")
    : 'Just now';
    
  const isTruncated = content.length > TRUNCATE_LENGTH;
  const displayedContent = isTruncated
    ? `${content.substring(0, TRUNCATE_LENGTH)}...`
    : content;

  if (isLocked) {
    return (
      <Card className={cn(className, "relative group/card")} style={style}>
        <CardContent className="relative p-6">
           <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="mt-2 text-sm font-semibold text-foreground/80">
              Unlocks {formatDistanceToNow(openDate, { addSuffix: true })}
            </p>
          </div>
           <blockquote className="border-l-2 border-border pl-4 italic text-transparent blur-sm select-none">
            {displayedContent}
          </blockquote>
        </CardContent>
        <CardFooter className="flex justify-end p-6 pt-0">
          <p className="text-sm text-muted-foreground">{formattedTimestamp}</p>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className={cn(className, "relative group/card")} style={style}>
      <CardContent className="relative p-6 pb-0">
        <p className="font-normal capitalize text-foreground/80 text-base mb-2">For <span className="font-playfair italic">{recipient}</span>,</p>
        <blockquote className="border-l-2 border-border pl-4 italic text-foreground">
          {displayedContent}
        </blockquote>
        {isTruncated && (
          <>
            <div className="absolute bottom-0 right-6 left-6 h-16 bg-gradient-to-t from-card to-transparent pointer-events-none"></div>
            <div className="absolute bottom-1 right-6 flex items-center justify-end text-sm font-semibold text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <ArrowRight className="h-4 w-4" />
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center p-6">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-muted-foreground transition-all duration-300 -ml-2 opacity-0 group-hover/card:opacity-100"
          onClick={handleFavoriteClick}
        >
            <Star className={cn("h-5 w-5", favorite ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground")} />
        </Button>
        <p className="text-sm text-muted-foreground">{formattedTimestamp}</p>
      </CardFooter>
    </Card>
  );
}

const TRUNCATE_LENGTH = 150;

    