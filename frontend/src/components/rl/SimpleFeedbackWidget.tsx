import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, CheckCircle } from 'lucide-react';

interface SimpleFeedbackWidgetProps {
  documentId: number;
  onFeedbackSubmitted?: () => void;
  label?: string;
}

export const SimpleFeedbackWidget: React.FC<SimpleFeedbackWidgetProps> = ({
  documentId,
  onFeedbackSubmitted,
  label = "Was this analysis helpful?"
}) => {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submitFeedback = async (rating: number) => {
    setSubmitting(true);
    
    try {
      const response = await fetch('/api/rl/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId,
          feedbackType: 'overall',
          rating
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        onFeedbackSubmitted?.();
        
        // Hide after 3 seconds
        setTimeout(() => setSubmitted(false), 3000);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm p-2 rounded bg-green-50">
        <CheckCircle className="h-4 w-4" />
        <span>Thanks! This helps our AI improve.</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => submitFeedback(5)}
          disabled={submitting}
          className="hover:bg-green-50 hover:text-green-600 hover:border-green-300"
        >
          <ThumbsUp className="h-4 w-4 mr-1" />
          Yes
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => submitFeedback(1)}
          disabled={submitting}
          className="hover:bg-red-50 hover:text-red-600 hover:border-red-300"
        >
          <ThumbsDown className="h-4 w-4 mr-1" />
          No
        </Button>
      </div>
    </div>
  );
};

export default SimpleFeedbackWidget;