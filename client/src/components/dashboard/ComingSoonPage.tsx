import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface ComingSoonPageProps {
  title: string;
}

const ComingSoonPage: React.FC<ComingSoonPageProps> = ({ title }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold gradient-text mb-2">{title}</h1>
        <p className="text-xl text-muted-foreground">This feature is currently under development</p>
      </div>
      
      <Card className="w-full max-w-lg">
        <CardContent className="flex flex-col items-center space-y-4 p-6">
          <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
          </div>
          
          <h2 className="text-xl font-semibold text-center">Coming Soon!</h2>
          
          <p className="text-center text-muted-foreground">
            We're working hard to bring you the best {title.toLowerCase()} experience possible.
            Check back later for updates on this exciting new feature.
          </p>
          
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-health w-3/4 rounded-full"></div>
          </div>
          
          <p className="text-sm text-muted-foreground">Development progress: 75%</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComingSoonPage; 