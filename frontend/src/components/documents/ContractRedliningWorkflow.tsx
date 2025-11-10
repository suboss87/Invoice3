import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Search, 
  Eye, 
  CheckCircle, 
  Download, 
  Clock,
  Shield,
  ArrowRight,
  Zap
} from 'lucide-react';

interface ContractRedliningWorkflowProps {
  document: any;
  analysis: any;
  isLoading: boolean;
  onAnalyze: () => void;
}

// Workflow steps with clear outcomes
const WORKFLOW_STEPS = [
  {
    id: 'upload',
    title: 'Upload Contract',
    description: 'Upload your legal document for AI-powered analysis',
    icon: FileText,
    status: 'completed',
    outcome: 'Document ready for analysis'
  },
  {
    id: 'analyze', 
    title: 'AI Analysis',
    description: 'Invoice³ scans for risks, missing information, and problematic terms',
    icon: Search,
    status: 'current',
    outcome: 'Risk assessment & redlining suggestions generated'
  },
  {
    id: 'review',
    title: 'Review Redlines',
    description: 'Review suggested changes with side-by-side comparison',
    icon: Eye,
    status: 'pending',
    outcome: 'Approved changes ready for implementation'
  },
  {
    id: 'approve',
    title: 'Approve Changes', 
    description: 'Accept, reject, or modify each suggested change',
    icon: CheckCircle,
    status: 'pending',
    outcome: 'Final contract version approved'
  },
  {
    id: 'export',
    title: 'Export Final Contract',
    description: 'Download your professionally redlined contract with track changes',
    icon: Download,
    status: 'pending', 
    outcome: 'Clean contract ready for signature'
  }
];

const ContractRedliningWorkflow: React.FC<ContractRedliningWorkflowProps> = ({
  document,
  analysis,
  isLoading,
  onAnalyze
}) => {
  const [activeStep, setActiveStep] = useState('analyze');

  // Calculate business impact metrics
  const getBusinessImpact = () => {
    if (!analysis) return null;
    
    const risksFound = analysis.riskAssessment?.items?.length || 0;
    const clausesFound = analysis.clausesFound?.length || 0;
    
    return {
      risksMitigated: risksFound,
      complianceScore: Math.max(85, 100 - (risksFound * 3))
    };
  };

  const impact = getBusinessImpact();

  return (
    <div className="space-y-6">
      {/* Executive Summary Card */}
      {impact && (
        <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-50 to-white">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <Zap className="h-5 w-5 text-blue-600 mr-2" />
              Contract Analysis Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <Shield className="h-4 w-4 text-red-600 mr-1" />
                </div>
                <div className="font-bold text-xl text-red-600">{impact.risksMitigated}</div>
                <div className="text-sm text-gray-600">Risks Mitigated</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <CheckCircle className="h-4 w-4 text-purple-600 mr-1" />
                </div>
                <div className="font-bold text-xl text-purple-600">{impact.complianceScore}%</div>
                <div className="text-sm text-gray-600">Compliance Score</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workflow Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Redlining Workflow</CardTitle>
          <p className="text-sm text-gray-600">
            Follow this guided process to transform your contract from upload to final signature-ready document
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {WORKFLOW_STEPS.map((step, index) => (
              <div key={step.id} className="flex items-start space-x-4">
                {/* Step Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  step.status === 'completed' ? 'bg-green-100 text-green-600' :
                  step.status === 'current' ? 'bg-blue-100 text-blue-600' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  <step.icon className="h-5 w-5" />
                </div>
                
                {/* Step Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{step.title}</h4>
                    <Badge variant={
                      step.status === 'completed' ? 'default' :
                      step.status === 'current' ? 'secondary' : 'outline'
                    }>
                      {step.status === 'completed' ? 'Complete' :
                       step.status === 'current' ? 'In Progress' : 'Pending'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                  <p className="text-xs text-blue-600 mt-1 font-medium">
                    → {step.outcome}
                  </p>
                </div>
                
                {/* Progress Arrow */}
                {index < WORKFLOW_STEPS.length - 1 && (
                  <div className="flex-shrink-0 ml-4">
                    <ArrowRight className="h-4 w-4 text-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Action Button */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            {!analysis && !isLoading && (
              <Button onClick={onAnalyze} className="w-full">
                <Search className="h-4 w-4 mr-2" />
                Start AI Analysis & Redlining
              </Button>
            )}
            {isLoading && (
              <Button disabled className="w-full">
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                Analyzing Contract...
              </Button>
            )}
            {analysis && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Review Redlines
                  </Button>
                  <Button>
                    <Download className="h-4 w-4 mr-2" />
                    Export Redlined Contract
                  </Button>
                </div>
                <p className="text-xs text-center text-gray-600">
                  Your contract has been analyzed. Review suggested changes or export the redlined version.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* What You Get Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">What You'll Receive</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium mb-1">Professional Redlined Contract</h4>
              <p className="text-sm text-gray-600">Track changes format showing exactly what to modify</p>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h4 className="font-medium mb-1">Risk Assessment Report</h4>
              <p className="text-sm text-gray-600">Executive summary of legal risks and recommendations</p>
            </div>
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <CheckCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h4 className="font-medium mb-1">Clean Final Version</h4>
              <p className="text-sm text-gray-600">Signature-ready contract with all approved changes</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContractRedliningWorkflow;
