import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { 
  ThumbsUp, 
  ThumbsDown, 
  Star, 
  MessageSquare,
  CheckCircle,
  XCircle 
} from 'lucide-react';

interface FeedbackWidgetProps {
  documentId: number;
  analysisId?: number;
  feedbackType: 'risk_assessment' | 'recommendation' | 'pattern_match' | 'overall';
  category?: string;
  specificFinding?: string;
  onFeedbackSubmitted?: (success: boolean) => void;
  compact?: boolean;
}

interface FeedbackData {
  rating: number;
  comment: string;
  confidence: number;
}

export const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({
  documentId,
  analysisId,
  feedbackType,
  category,
  specificFinding,
  onFeedbackSubmitted,
  compact = false
}) => {
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackData>({
    rating: 0,
    comment: '',
    confidence: 5
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submitFeedback = async (rating: number, comment?: string) => {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/rl/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId,
          analysisId,
          feedbackType,
          rating,
          category,
          specificFinding,
          comment,
          context: {
            contractType: 'Contract', // This could be passed as prop
            timestamp: new Date().toISOString()
          }
        }),
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        setSubmitted(true);
        setShowFeedbackForm(false);
        onFeedbackSubmitted?.(true);
        
        // Hide success message after 3 seconds
        setTimeout(() => setSubmitted(false), 3000);
      } else {
        console.error('Failed to submit feedback:', result.message);
        onFeedbackSubmitted?.(false);
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      onFeedbackSubmitted?.(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFeedback = (rating: number) => {
    submitFeedback(rating);
  };

  const handleDetailedFeedback = () => {
    if (feedback.rating > 0) {
      submitFeedback(feedback.rating, feedback.comment);
    }
  };

  // Track behavior for implicit feedback
  const trackBehavior = async (actionType: string, actionValue?: string) => {
    try {
      await fetch('/api/rl/behavior', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId,
          analysisId: analysisId || 0,
          actionType,
          actionValue,
          elementId: `feedback-${feedbackType}`,
          sessionId: Math.random().toString(36).substr(2, 9), // Simple session ID
          metadata: {
            feedbackType,
            category,
            compact
          }
        }),
      });
    } catch (error) {
      console.error('Error tracking behavior:', error);
    }
  };

  const getFeedbackLabel = () => {
    switch (feedbackType) {
      case 'risk_assessment':
        return 'Was this risk assessment helpful?';
      case 'recommendation':
        return 'Was this recommendation useful?';
      case 'pattern_match':
        return 'Was this finding accurate?';
      case 'overall':
        return 'How would you rate this analysis?';
      default:
        return 'Was this helpful?';
    }
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm">
        <CheckCircle className="h-4 w-4" />
        <span>Thank you for your feedback! Our AI is learning from your input.</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">{getFeedbackLabel()}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            handleQuickFeedback(5);
            trackBehavior('thumbs_up');
          }}
          disabled={isSubmitting}
          className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
        >
          <ThumbsUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            handleQuickFeedback(1);
            trackBehavior('thumbs_down');
          }}
          disabled={isSubmitting}
          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
        >
          <ThumbsDown className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setShowFeedbackForm(true);
            trackBehavior('expand_feedback');
          }}
          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
        >
          <MessageSquare className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Card className="mt-4">
      <CardContent className="pt-6">
        {!showFeedbackForm ? (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">
              {getFeedbackLabel()}
            </h4>
            
            <div className="flex items-center gap-3">
              {/* Quick star rating */}
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Button
                    key={star}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleQuickFeedback(star);
                      trackBehavior('star_rating', star.toString());
                    }}
                    disabled={isSubmitting}
                    className="h-8 w-8 p-0 hover:bg-yellow-50"
                  >
                    <Star 
                      className={`h-4 w-4 ${
                        star <= feedback.rating || isSubmitting 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-gray-300'
                      }`} 
                    />
                  </Button>
                ))}
              </div>
              
              <span className="text-sm text-gray-500">|</span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowFeedbackForm(true);
                  trackBehavior('detailed_feedback_open');
                }}
                disabled={isSubmitting}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Add comment
              </Button>
            </div>
            
            {isSubmitting && (
              <div className="text-sm text-gray-500">
                Submitting feedback...
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900">
              Detailed Feedback
            </h4>
            
            {/* Star rating */}
            <div className="space-y-2">
              <label className="text-sm text-gray-700">Rating (required)</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Button
                    key={star}
                    variant="ghost"
                    size="sm"
                    onClick={() => setFeedback(prev => ({ ...prev, rating: star }))}
                    className="h-8 w-8 p-0 hover:bg-yellow-50"
                  >
                    <Star 
                      className={`h-4 w-4 ${
                        star <= feedback.rating 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-gray-300'
                      }`} 
                    />
                  </Button>
                ))}
                <span className="ml-2 text-sm text-gray-600">
                  {feedback.rating === 0 ? 'Select rating' :
                   feedback.rating === 1 ? 'Very poor' :
                   feedback.rating === 2 ? 'Poor' :
                   feedback.rating === 3 ? 'Average' :
                   feedback.rating === 4 ? 'Good' : 'Excellent'}
                </span>
              </div>
            </div>
            
            {/* Comment */}
            <div className="space-y-2">
              <label className="text-sm text-gray-700">
                Comment (optional)
              </label>
              <Textarea
                placeholder="Tell us more about your experience with this analysis..."
                value={feedback.comment}
                onChange={(e) => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
                rows={3}
                className="resize-none"
              />
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleDetailedFeedback}
                disabled={feedback.rating === 0 || isSubmitting}
                size="sm"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit Feedback
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowFeedbackForm(false);
                  trackBehavior('feedback_cancelled');
                }}
                disabled={isSubmitting}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
            
            <p className="text-xs text-gray-500">
              Your feedback helps our AI learn and improve future analyses.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FeedbackWidget;