import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";

export function RecommendationCard({ title, body, score }: { title: string; body: string; score?: number }) {
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted">{body}</div>
      </CardContent>
      <CardFooter>
        <div className="text-xs text-muted">Score: {typeof score === "number" ? score : "—"}</div>
      </CardFooter>
    </Card>
  );
}

export default RecommendationCard;
