import React from 'react';
import { format, parseISO } from 'date-fns';
import { Check, Cloud, Database } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface JournalEntryProps {
  entry: {
    id: string;
    date: string;
    content: string;
    mood?: string;
    isStored?: {
      relay: boolean;
      blossom: boolean;
    };
  };
  onSaveToRelay: () => void;
  onSaveToBlossomServer: () => void;
}

const JournalEntry: React.FC<JournalEntryProps> = ({ 
  entry, 
  onSaveToRelay, 
  onSaveToBlossomServer 
}) => {
  const entryDate = parseISO(entry.date);
  const formattedDate = format(entryDate, "h:mm a");

  // Function to format entry content with line breaks
  const formatContent = (content: string) => {
    return content.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        <br />
      </React.Fragment>
    ));
  };

  return (
    <Card variant="default" className="overflow-hidden transition-all">
      <CardHeader className="bg-background/50 py-3 px-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{formattedDate}</span>
        </div>

        {entry.mood && (
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">{entry.mood}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-4 bg-card">
        <div className="prose prose-sm max-w-none dark:prose-invert">
          <p className="whitespace-pre-line">{formatContent(entry.content)}</p>
        </div>
      </CardContent>

      <CardFooter className="px-4 py-3 bg-background/50 flex justify-end gap-2">
        <Button
          variant={entry.isStored?.relay ? "secondary" : "glass"}
          size="sm"
          className="gap-1 text-xs"
          onClick={onSaveToRelay}
          title="Save to Nostr Relay"
        >
          {entry.isStored?.relay ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>Saved to Relay</span>
            </>
          ) : (
            <>
              <Cloud className="h-3.5 w-3.5" />
              <span>Save to Relay</span>
            </>
          )}
        </Button>

        <Button
          variant={entry.isStored?.blossom ? "secondary" : "glass"}
          size="sm"
          className="gap-1 text-xs"
          onClick={onSaveToBlossomServer}
          title="Save to Blossom Server"
        >
          {entry.isStored?.blossom ? (
            <>
              <Check className="h-3.5 w-3.5" />
              <span>Saved to Blossom</span>
            </>
          ) : (
            <>
              <Database className="h-3.5 w-3.5" />
              <span>Save to Blossom</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default JournalEntry; 