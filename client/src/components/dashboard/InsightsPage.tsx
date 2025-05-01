import React, { useState, useEffect } from 'react';
import { Calendar, BookOpen, Star, Download, Upload, PenLine } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import JournalEntry from './JournalEntry';

// Define the journal entry type
interface JournalEntryType {
  id: string;
  date: string; // ISO string format
  content: string;
  mood?: string;
  isStored?: {
    relay: boolean;
    blossom: boolean;
  };
}

const InsightsPage: React.FC = () => {
  const [journalEntries, setJournalEntries] = useState<JournalEntryType[]>([]);
  const [newEntry, setNewEntry] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'relay' | 'blossom'>('relay');
  const [activeTab, setActiveTab] = useState<string>('journal');

  // Load journal entries from localStorage on component mount
  useEffect(() => {
    const savedEntries = localStorage.getItem('journalEntries');
    if (savedEntries) {
      setJournalEntries(JSON.parse(savedEntries));
    }
  }, []);

  // Save journal entries to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('journalEntries', JSON.stringify(journalEntries));
  }, [journalEntries]);

  // Handle creating a new journal entry
  const handleCreateEntry = () => {
    if (!newEntry.trim()) return;

    const newJournalEntry: JournalEntryType = {
      id: uuidv4(),
      date: selectedDate.toISOString(),
      content: newEntry,
      isStored: {
        relay: false,
        blossom: false
      }
    };

    setJournalEntries([newJournalEntry, ...journalEntries]);
    setNewEntry('');
  };

  // Filter entries by selected date
  const filteredEntries = journalEntries.filter(entry => {
    const entryDate = parseISO(entry.date);
    return entryDate.toDateString() === selectedDate.toDateString();
  });

  // Handle save to relay or blossom
  const handleSaveToService = (entryId: string, service: 'relay' | 'blossom') => {
    setModalType(service);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold gradient-text">Insights</h1>
        <p className="text-muted-foreground">
          Track your daily health journey with personal notes and reflections.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="journal" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Journal
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="journal" className="space-y-6 animate-scale-in">
          <Card variant="glass">
            <CardHeader className="border-b border-border/30 bg-primary/5">
              <CardTitle className="flex items-center text-xl">
                <PenLine className="mr-2 h-5 w-5 text-primary" />
                New Journal Entry
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <p className="text-muted-foreground">{format(selectedDate, 'PPPP')}</p>
                </div>
                <Textarea 
                  placeholder="How are you feeling today? Share your health insights, reflections, and goals..."
                  className="min-h-[120px]"
                  value={newEntry}
                  onChange={(e) => setNewEntry(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="border-t border-border/30 bg-background/50 p-4">
              <Button 
                variant="gradient" 
                className="ml-auto"
                onClick={handleCreateEntry}
                disabled={!newEntry.trim()}
              >
                Save Entry
              </Button>
            </CardFooter>
          </Card>

          {filteredEntries.length > 0 ? (
            <div className="space-y-4">
              {filteredEntries.map(entry => (
                <JournalEntry
                  key={entry.id}
                  entry={entry}
                  onSaveToRelay={() => handleSaveToService(entry.id, 'relay')}
                  onSaveToBlossomServer={() => handleSaveToService(entry.id, 'blossom')}
                />
              ))}
            </div>
          ) : (
            <Card className="bg-muted/50 border-dashed border-2 border-muted">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No entries for this date. Create your first journal entry above!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6 animate-scale-in">
          <Card variant="glass">
            <CardHeader className="border-b border-border/30 bg-primary/5">
              <CardTitle className="flex items-center text-xl">
                <Calendar className="mr-2 h-5 w-5 text-primary" />
                Calendar View
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex justify-center">
                <CalendarComponent
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Coming Soon Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Coming Soon!</DialogTitle>
            <DialogDescription>
              {modalType === 'relay' 
                ? 'Saving entries to Nostr relays will be available in a future update.'
                : 'Saving entries to your personal Blossom server will be available in a future update.'}
            </DialogDescription>
          </DialogHeader>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-health w-1/2 rounded-full"></div>
          </div>
          <p className="text-sm text-muted-foreground text-center">Development progress: 50%</p>
          <Button variant="gradient" onClick={() => setIsModalOpen(false)}>
            Stay Tuned!
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InsightsPage; 