/**
 * Real-Time Processing Pipeline Visualization
 * Shows AI processing stages with animated progress
 */
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Loader2, Clock } from 'lucide-react';

interface ProcessingStage {
  id: string;
  name: string;
  icon: string;
  description: string;
  estimatedTime: number; // seconds
}

const PROCESSING_STAGES: ProcessingStage[] = [
  {
    id: 'upload',
    name: 'Upload',
    icon: '📤',
    description: 'File uploaded successfully',
    estimatedTime: 2
  },
  {
    id: 'extraction',
    name: 'LandingAI ADE',
    icon: '🔍',
    description: 'Extracting 45+ fields using AI',
    estimatedTime: 20
  },
  {
    id: 'matching',
    name: '3-Way Matching',
    icon: '🎯',
    description: 'Validating Invoice ↔ PO ↔ GRN',
    estimatedTime: 5
  },
  {
    id: 'fraud',
    name: 'Fraud Detection',
    icon: '🛡️',
    description: 'Analyzing risk signals with LLM',
    estimatedTime: 3
  },
  {
    id: 'complete',
    name: 'Complete',
    icon: '✅',
    description: 'Processing finished',
    estimatedTime: 0
  }
];

interface ProcessingPipelineProps {
  status: string;
  onComplete?: () => void;
}

export function ProcessingPipeline({ status, onComplete }: ProcessingPipelineProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [stageProgress, setStageProgress] = useState(0);
  const [completedStages, setCompletedStages] = useState<string[]>([]);
  
  useEffect(() => {
    // Map backend status to stage index
    const statusMap: Record<string, number> = {
      uploaded: 0,
      processing: 1,
      extracting: 1,
      matching: 2,
      'fraud_check': 3,
      fraudcheck: 3,
      completed: 4
    };
    
    const normalizedStatus = (status || '').toLowerCase();
    const stageIdx = statusMap[normalizedStatus] ?? 0;
    setCurrentStageIndex(stageIdx);
    
    // Mark previous stages as complete
    const completed = PROCESSING_STAGES.slice(0, stageIdx).map(s => s.id);
    setCompletedStages(completed);
    
    // If complete, trigger callback
    if (normalizedStatus === 'completed' && onComplete) {
      onComplete();
    }
  }, [status, onComplete]);
  
  // Simulate progress within current stage
  useEffect(() => {
    if (currentStageIndex >= PROCESSING_STAGES.length - 1) {
      setStageProgress(100);
      return;
    }
    
    const currentStage = PROCESSING_STAGES[currentStageIndex];
    const interval = setInterval(() => {
      setStageProgress(prev => {
        if (prev >= 95) return prev; // Cap at 95% until backend confirms
        return prev + (100 / currentStage.estimatedTime) / 10;
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, [currentStageIndex]);
  
  const overallProgress = ((currentStageIndex + (stageProgress / 100)) / PROCESSING_STAGES.length) * 100;
  
  return (
    <Card className="bg-white/[0.06] border-white/[0.15] backdrop-blur-xl">
      <CardContent className="p-6 space-y-6">
        {/* Overall Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-semibold text-white/90">Processing Invoice</span>
            <span className="text-sm font-bold text-blue-400">{Math.round(overallProgress)}%</span>
          </div>
          <div className="w-full bg-white/[0.08] rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
        
        {/* Stage Indicators */}
        <div className="grid grid-cols-5 gap-2">
          {PROCESSING_STAGES.map((stage, idx) => {
            const isActive = idx === currentStageIndex;
            const isComplete = completedStages.includes(stage.id);
            const isPending = idx > currentStageIndex;

            return (
              <div
                key={stage.id}
                className={`
                  relative flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-300
                  ${isActive ? 'border-blue-500 bg-blue-500/10 scale-105 shadow-lg shadow-blue-500/20' : ''}
                  ${isComplete ? 'border-emerald-500 bg-emerald-500/10' : ''}
                  ${isPending ? 'border-white/[0.10] bg-white/[0.03] opacity-60' : ''}
                `}
              >
                {/* Icon */}
                <div className={`text-3xl mb-2 ${isActive ? 'animate-bounce' : ''}`}>
                  {stage.icon}
                </div>

                {/* Name */}
                <div className="text-xs font-semibold text-center mb-1 text-white/90">
                  {stage.name}
                </div>

                {/* Status Indicator */}
                {isComplete && (
                  <CheckCircle className="h-4 w-4 text-emerald-400 absolute top-1 right-1" />
                )}
                {isActive && (
                  <Loader2 className="h-4 w-4 text-blue-400 animate-spin absolute top-1 right-1" />
                )}
                {isPending && (
                  <Clock className="h-4 w-4 text-white/30 absolute top-1 right-1" />
                )}

                {/* Progress dot */}
                {isActive && (
                  <div className="mt-2">
                    <div className="h-1 w-12 bg-white/[0.15] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-400 transition-all duration-300"
                        style={{ width: `${stageProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Current Stage Details */}
        <div className="flex items-center gap-3 p-4 bg-white/[0.06] rounded-lg border border-white/[0.15]">
          <div className="text-4xl">{PROCESSING_STAGES[currentStageIndex]?.icon}</div>
          <div className="flex-1">
            <div className="font-semibold text-white/90">
              {PROCESSING_STAGES[currentStageIndex]?.name}
            </div>
            <div className="text-sm text-white/60">
              {PROCESSING_STAGES[currentStageIndex]?.description}
            </div>
          </div>
          {currentStageIndex < PROCESSING_STAGES.length - 1 && (
            <Badge variant="outline" className="animate-pulse bg-blue-500/10 border-blue-500/30 text-blue-400">
              Processing...
            </Badge>
          )}
        </div>

        {/* Real-time activity indicators */}
        {currentStageIndex === 1 && (
          <div className="space-y-2 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="text-xs font-semibold text-blue-400 mb-2">Extraction Activity:</div>
            <div className="space-y-1">
              {[
                { label: 'Invoice number', done: stageProgress > 20 },
                { label: 'Vendor information', done: stageProgress > 40 },
                { label: 'Line items', done: stageProgress > 60 },
                { label: 'Bank details', done: stageProgress > 80 }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  {item.done ? (
                    <CheckCircle className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Loader2 className="h-3 w-3 text-blue-400 animate-spin" />
                  )}
                  <span className={item.done ? 'text-emerald-400' : 'text-white/60'}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
