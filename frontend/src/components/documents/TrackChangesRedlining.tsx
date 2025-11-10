import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Check, 
  X, 
  Edit, 
  MessageCircle, 
  User, 
  Clock,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';

interface TrackChange {
  id: string;
  type: 'deletion' | 'insertion' | 'modification';
  originalText: string;
  newText: string;
  reason: string;
  author: string;
  timestamp: Date;
  status: 'pending' | 'accepted' | 'rejected';
  riskLevel: 'high' | 'medium' | 'low';
  section: string;
}

interface TrackChangesRedliningProps {
  document: any;
  analysis: any;
  onApproveChange: (changeId: string) => void;
  onRejectChange: (changeId: string) => void;
  onExportRedlined: () => void;
}

// Generate track changes from analysis
const generateTrackChanges = (analysis: any): TrackChange[] => {
  if (!analysis?.clausesFound) return [];
  
  return analysis.clausesFound.map((clause: any, index: number) => ({
    id: `change-${index}`,
    type: clause.redlining_action === 'replace' ? 'modification' : 
          clause.redlining_action === 'delete' ? 'deletion' : 'insertion',
    originalText: clause.current_text,
    newText: clause.suggested_replacement,
    reason: clause.explanation,
    author: 'Invoice³ AI',
    timestamp: new Date(),
    status: 'pending' as const,
    riskLevel: clause.risk_level as 'high' | 'medium' | 'low',
    section: clause.section
  }));
};

const TrackChangesRedlining: React.FC<TrackChangesRedliningProps> = ({
  document,
  analysis,
  onApproveChange,
  onRejectChange,
  onExportRedlined
}) => {
  const [trackChanges, setTrackChanges] = useState<TrackChange[]>(
    generateTrackChanges(analysis)
  );
  const [showRejected, setShowRejected] = useState(false);
  const [viewMode, setViewMode] = useState<'simple' | 'advanced'>('simple');

  const handleApprove = (changeId: string) => {
    setTrackChanges(prev => 
      prev.map(change => 
        change.id === changeId 
          ? { ...change, status: 'accepted' }
          : change
      )
    );
    onApproveChange(changeId);
  };

  const handleReject = (changeId: string) => {
    setTrackChanges(prev => 
      prev.map(change => 
        change.id === changeId 
          ? { ...change, status: 'rejected' }
          : change
      )
    );
    onRejectChange(changeId);
  };

  const getChangeColor = (change: TrackChange) => {
    if (change.status === 'accepted') return 'border-green-300 bg-green-50';
    if (change.status === 'rejected') return 'border-red-300 bg-red-50';
    return change.riskLevel === 'high' ? 'border-red-300 bg-red-50' :
           change.riskLevel === 'medium' ? 'border-yellow-300 bg-yellow-50' :
           'border-blue-300 bg-blue-50';
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case 'deletion': return '🗑️';
      case 'insertion': return '✨';
      case 'modification': return '✏️';
      default: return '📝';
    }
  };

  const pendingChanges = trackChanges.filter(c => c.status === 'pending');
  const acceptedChanges = trackChanges.filter(c => c.status === 'accepted');
  const rejectedChanges = trackChanges.filter(c => c.status === 'rejected');

  // Generate redlined document preview
  const generateRedlinedPreview = () => {
    let documentContent = document.content;
    
    trackChanges
      .filter(change => change.status !== 'rejected')
      .forEach(change => {
        if (change.status === 'accepted') {
          // Apply the change
          documentContent = documentContent.replace(
            change.originalText, 
            change.newText
          );
        } else {
          // Show pending changes with markup
          const markup = `<span class="track-change pending" data-change-id="${change.id}">
            <del class="deletion">${change.originalText}</del>
            <ins class="insertion">${change.newText}</ins>
          </span>`;
          documentContent = documentContent.replace(change.originalText, markup);
        }
      });
    
    return documentContent;
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{pendingChanges.length}</div>
            <div className="text-sm text-gray-600">Pending Review</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{acceptedChanges.length}</div>
            <div className="text-sm text-gray-600">Accepted</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{rejectedChanges.length}</div>
            <div className="text-sm text-gray-600">Rejected</div>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round((acceptedChanges.length / trackChanges.length) * 100) || 0}%
            </div>
            <div className="text-sm text-gray-600">Completion</div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <Button
            variant={viewMode === 'simple' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('simple')}
          >
            Simple View
          </Button>
          <Button
            variant={viewMode === 'advanced' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('advanced')}
          >
            Track Changes View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRejected(!showRejected)}
          >
            {showRejected ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
            {showRejected ? 'Hide' : 'Show'} Rejected
          </Button>
        </div>
        
        <div className="space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Track Changes
          </Button>
          <Button onClick={onExportRedlined} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Clean Version
          </Button>
        </div>
      </div>

      {/* Track Changes List */}
      <Card>
        <CardHeader>
          <CardTitle>Proposed Changes</CardTitle>
          <p className="text-sm text-gray-600">
            Review each change and decide whether to accept, reject, or modify
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trackChanges
              .filter(change => showRejected || change.status !== 'rejected')
              .map((change) => (
              <div key={change.id} className={`border rounded-lg p-4 ${getChangeColor(change)}`}>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getChangeIcon(change.type)}</span>
                    <Badge variant="outline" className="text-xs">
                      {change.type.toUpperCase()}
                    </Badge>
                    <Badge 
                      variant={change.riskLevel === 'high' ? 'destructive' : 
                               change.riskLevel === 'medium' ? 'secondary' : 'default'}
                      className="text-xs"
                    >
                      {change.riskLevel.toUpperCase()} RISK
                    </Badge>
                  </div>
                  
                  {change.status === 'pending' && (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-300 hover:bg-green-50"
                        onClick={() => handleApprove(change.id)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                        onClick={() => handleReject(change.id)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                  
                  {change.status !== 'pending' && (
                    <Badge 
                      variant={change.status === 'accepted' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {change.status.toUpperCase()}
                    </Badge>
                  )}
                </div>

                {/* Section Info */}
                <div className="text-xs text-gray-600 mb-2">
                  Section: {change.section} • {change.author} • {change.timestamp.toLocaleString()}
                </div>

                {/* Change Content */}
                <div className="space-y-3">
                  {/* Original Text */}
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Original:</div>
                    <div className="text-sm p-3 bg-white border border-red-200 rounded">
                      <del className="text-red-700 line-through">{change.originalText}</del>
                    </div>
                  </div>

                  {/* New Text */}
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Suggested:</div>
                    <div className="text-sm p-3 bg-white border border-green-200 rounded">
                      <ins className="text-green-700 no-underline bg-green-100 px-1 rounded">
                        {change.newText}
                      </ins>
                    </div>
                  </div>

                  {/* Explanation */}
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-1">Reason:</div>
                    <div className="text-sm text-gray-600 p-3 bg-gray-50 border border-gray-200 rounded">
                      <MessageCircle className="h-4 w-4 inline mr-2" />
                      {change.reason}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {trackChanges.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Edit className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="font-medium mb-2">No Changes Suggested</h3>
              <p className="text-sm">Run contract analysis to generate redlining suggestions</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Preview */}
      {viewMode === 'advanced' && trackChanges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Document Preview with Track Changes</CardTitle>
            <p className="text-sm text-gray-600">
              Preview how your document will look with all approved changes
            </p>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none text-sm border border-gray-200 rounded p-4 bg-gray-50 max-h-96 overflow-y-auto">
              <div 
                dangerouslySetInnerHTML={{ 
                  __html: generateRedlinedPreview() 
                }}
                className="whitespace-pre-wrap"
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TrackChangesRedlining;
