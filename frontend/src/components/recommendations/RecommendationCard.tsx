import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Copy, 
  ChevronDown, 
  ChevronRight, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  DollarSign,
  CheckCircle2,
  ArrowRight,
  FileText,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface ActionableRecommendation {
  id: string;
  documentId: number;
  type: 'addition' | 'deletion' | 'modification' | 'comment';
  priority: 'high' | 'medium' | 'low';
  section: string;
  
  // Core recommendation content
  currentText: string;
  replacementText: string;
  rationale: string;
  
  // Financial impact
  financialImpact: {
    estimatedSavings?: number;
    riskReduction?: number;
    currency: string;
    description: string;
  };
  
  // Action guidance
  actionSteps: string[];
  copyPasteText: string;
  
  // Metadata
  category: 'risk_mitigation' | 'term_clarification' | 'compliance' | 'negotiation' | 'best_practice';
  confidence: number;
  estimatedEffort: 'low' | 'medium' | 'high';
  relatedRiskId?: string;
}

interface RecommendationCardProps {
  recommendation: ActionableRecommendation;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  isExpanded = false,
  onToggleExpanded
}) => {
  const { toast } = useToast();
  const [showFullText, setShowFullText] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  // ML Feedback submission function
  const handleRecommendationFeedback = async (feedback: 'positive' | 'negative') => {
    try {
      const response = await fetch('/api/feedback/suggestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          suggestionId: recommendation.id,
          documentId: recommendation.documentId,
          feedback: feedback,
          suggestionType: recommendation.category,
          contractType: 'unknown', // Add contract type if available
          priority: recommendation.priority,
          metadata: {
            type: recommendation.type,
            section: recommendation.section,
            rationale: recommendation.rationale,
            currentText: recommendation.currentText.substring(0, 100), // Limit for storage
            replacementText: recommendation.replacementText.substring(0, 100)
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setFeedbackGiven(true);
        toast({
          title: feedback === 'positive' ? "👍 Thank you!" : "👎 Feedback received",
          description: "Your feedback helps improve our recommendations.",
          duration: 2000,
        });
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'low':
        return <Info className="h-4 w-4 text-blue-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50/30';
      case 'medium':
        return 'border-l-amber-500 bg-amber-50/30';
      case 'low':
        return 'border-l-blue-500 bg-blue-50/30';
      default:
        return 'border-l-gray-500 bg-gray-50/30';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive" className="text-xs">🔴 Critical</Badge>;
      case 'medium':
        return <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800 hover:bg-amber-100">🟡 High</Badge>;
      case 'low':
        return <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 hover:bg-blue-100">🟢 Medium</Badge>;
      default:
        return <Badge variant="outline" className="text-xs">Info</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'risk_mitigation':
        return '🛡️';
      case 'compliance':
        return '⚖️';
      case 'negotiation':
        return '🤝';
      case 'term_clarification':
        return '📝';
      case 'best_practice':
        return '⭐';
      default:
        return '📋';
    }
  };

  const handleCopyReplacementText = async () => {
    try {
      await navigator.clipboard.writeText(recommendation.replacementText);
      toast({
        title: "📋 Copied to clipboard",
        description: "Replacement text copied successfully",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Unable to copy text to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleCopyFullInstructions = async () => {
    try {
      await navigator.clipboard.writeText(recommendation.copyPasteText);
      toast({
        title: "📋 Instructions copied",
        description: "Full copy-paste instructions copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Unable to copy instructions to clipboard",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: recommendation.financialImpact.currency || 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const truncateText = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <Card 
      className={`border-l-4 ${getPriorityColor(recommendation.priority)} hover:shadow-md transition-all duration-200 bg-white`}
      data-testid={`recommendation-card-${recommendation.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-shrink-0">
              {getPriorityIcon(recommendation.priority)}
              <span className="text-lg">{getCategoryIcon(recommendation.category)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {getPriorityBadge(recommendation.priority)}
                <Badge variant="outline" className="text-xs capitalize">
                  {recommendation.type}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {recommendation.section}
                </Badge>
              </div>
              <h3 className="font-semibold text-gray-900 leading-tight text-sm">
                {recommendation.type === 'addition' ? 'Add: ' : 
                 recommendation.type === 'deletion' ? 'Remove: ' : 
                 recommendation.type === 'modification' ? 'Modify: ' : ''}
                {recommendation.rationale}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {recommendation.financialImpact.estimatedSavings && (
              <div className="text-right">
                <div className="text-xs text-gray-500">Potential Savings</div>
                <div className="font-semibold text-green-600 text-sm flex items-center">
                  <DollarSign className="h-3 w-3 mr-1" />
                  {formatCurrency(recommendation.financialImpact.estimatedSavings)}
                </div>
              </div>
            )}
            {onToggleExpanded && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onToggleExpanded}
                data-testid={`button-expand-${recommendation.id}`}
              >
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Collapsible open={isExpanded} onOpenChange={onToggleExpanded}>
          <CollapsibleContent className="space-y-4">
            {/* Before/After Text Comparison */}
            {recommendation.type !== 'addition' && (
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-gray-700">📄 Current Text</h4>
                    <span className="text-xs text-gray-500">In {recommendation.section}</span>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-gray-800 font-mono leading-relaxed">
                      {showFullText ? recommendation.currentText : truncateText(recommendation.currentText)}
                    </p>
                    {recommendation.currentText.length > 150 && (
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="text-xs p-0 h-auto text-red-600"
                        onClick={() => setShowFullText(!showFullText)}
                      >
                        {showFullText ? 'Show less' : 'Show more'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-gray-700">
                  ✨ {recommendation.type === 'addition' ? 'Add This Text' : 'Replace With'}
                </h4>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleCopyReplacementText}
                  className="text-xs flex items-center gap-1"
                  data-testid={`button-copy-${recommendation.id}`}
                >
                  <Copy className="h-3 w-3" />
                  Copy
                </Button>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-md p-3">
                <p className="text-sm text-gray-800 font-mono leading-relaxed">
                  {recommendation.replacementText}
                </p>
              </div>
            </div>

            {/* Financial Impact Details */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                <DollarSign className="h-4 w-4 mr-1" />
                Financial Impact
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-blue-600 font-medium">Estimated Savings:</span>
                  <div className="font-semibold text-green-600">
                    {formatCurrency(recommendation.financialImpact.estimatedSavings)}
                  </div>
                </div>
                <div>
                  <span className="text-blue-600 font-medium">Risk Reduction:</span>
                  <div className="font-semibold text-blue-600">
                    {recommendation.financialImpact.riskReduction || 0}%
                  </div>
                </div>
              </div>
              <p className="text-xs text-blue-700 mt-2">{recommendation.financialImpact.description}</p>
            </div>

            {/* Action Steps */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <ArrowRight className="h-4 w-4 mr-1" />
                Action Steps
              </h4>
              <ol className="space-y-1">
                {recommendation.actionSteps.map((step, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="bg-blue-100 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                      {index + 1}
                    </span>
                    <span className="leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleCopyFullInstructions}
                className="flex items-center gap-1"
                data-testid={`button-copy-instructions-${recommendation.id}`}
              >
                <FileText className="h-4 w-4" />
                Copy Instructions
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                data-testid={`button-mark-complete-${recommendation.id}`}
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark Complete
              </Button>
            </div>

            {/* ML Feedback Section */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Rate this recommendation:</span>
                {!feedbackGiven ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-3 text-green-600 hover:bg-green-50 hover:text-green-700"
                      onClick={() => handleRecommendationFeedback('positive')}
                    >
                      <ThumbsUp className="h-3 w-3 mr-1" />
                      Helpful
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-3 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleRecommendationFeedback('negative')}
                    >
                      <ThumbsDown className="h-3 w-3 mr-1" />
                      Not helpful
                    </Button>
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 flex items-center">
                    <CheckCircle2 className="h-3 w-3 mr-1 text-green-600" />
                    Thanks for rating!
                  </div>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="text-xs text-gray-500 flex items-center gap-4 pt-2 border-t border-gray-100">
              <span>Confidence: {recommendation.confidence}%</span>
              <span>Effort: {recommendation.estimatedEffort}</span>
              <span>Category: {recommendation.category.replace('_', ' ')}</span>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default RecommendationCard;