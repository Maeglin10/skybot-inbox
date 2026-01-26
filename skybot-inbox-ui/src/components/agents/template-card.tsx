import { AgentTemplate } from '@/types/agents';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Download } from 'lucide-react';
import Link from 'next/link';

interface TemplateCardProps {
  template: AgentTemplate;
}

export function TemplateCard({ template }: TemplateCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{template.name}</CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {template.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          <Badge variant="secondary">{template.category}</Badge>

          {template.avgRating && (
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">
                {template.avgRating.toFixed(1)}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-muted-foreground">
            <Download className="h-4 w-4" />
            <span className="text-sm">
              {template.installCount.toLocaleString()} installs
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Link href={`/agents/marketplace/${template.slug}`} className="flex-1">
          <Button variant="outline" className="w-full">
            Learn More
          </Button>
        </Link>
        <Button className="flex-1">Install</Button>
      </CardFooter>
    </Card>
  );
}
