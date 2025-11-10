/**
 * 3-Way Matching Visualization
 * Shows Invoice ↔ PO ↔ GRN validation results
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';

interface MatchingResult {
  invoice_po_score: number;
  invoice_po_status: string;
  invoice_po_mismatches: string[];
  invoice_grn_score: number;
  invoice_grn_status: string;
  invoice_grn_mismatches: string[];
  overall_status: string;
  overall_score: number;
}

interface ThreeWayMatchingCardProps {
  matching: MatchingResult;
}

export function ThreeWayMatchingCard({ matching }: ThreeWayMatchingCardProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'MATCH':
        return {
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-700',
          badge: 'bg-green-100 text-green-800 border-green-300'
        };
      case 'PARTIAL':
        return {
          icon: <AlertTriangle className="h-5 w-5 text-yellow-600" />,
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-700',
          badge: 'bg-yellow-100 text-yellow-800 border-yellow-300'
        };
      case 'MISMATCH':
        return {
          icon: <XCircle className="h-5 w-5 text-red-600" />,
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-700',
          badge: 'bg-red-100 text-red-800 border-red-300'
        };
      default:
        return {
          icon: <AlertTriangle className="h-5 w-5 text-gray-600" />,
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-700',
          badge: 'bg-gray-100 text-gray-800 border-gray-300'
        };
    }
  };
  
  const overallConfig = getStatusConfig(matching.overall_status);
  const poConfig = getStatusConfig(matching.invoice_po_status);
  const grnConfig = getStatusConfig(matching.invoice_grn_status);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>3-Way Matching</span>
          <Badge className={`${overallConfig.badge} border-2`}>
            {matching.overall_status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className={`p-4 rounded-lg border-2 ${overallConfig.border} ${overallConfig.bg}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {overallConfig.icon}
              <span className={`font-semibold ${overallConfig.text}`}>
                Overall Match Score
              </span>
            </div>
            <span className={`text-3xl font-bold ${overallConfig.text}`}>
              {matching.overall_score}/100
            </span>
          </div>
          <Progress 
            value={matching.overall_score} 
            className="h-3"
          />
        </div>
        
        {/* Matching Flow Diagram */}
        <div className="space-y-4">
          <div className="text-sm font-semibold text-gray-700">Validation Flow</div>
          
          {/* Invoice ↔ PO */}
          <div className={`p-4 rounded-lg border-2 ${poConfig.border} ${poConfig.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="px-2 py-1 bg-white rounded text-xs font-semibold border-2 border-blue-300">
                    📄 Invoice
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-500" />
                  <div className="px-2 py-1 bg-white rounded text-xs font-semibold border-2 border-blue-300">
                    📋 PO
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {poConfig.icon}
                <span className={`font-bold ${poConfig.text}`}>
                  {matching.invoice_po_score}/100
                </span>
              </div>
            </div>
            <Progress value={matching.invoice_po_score} className="h-2 mb-2" />
            {matching.invoice_po_mismatches.length > 0 && (
              <div className="mt-2 space-y-1">
                {matching.invoice_po_mismatches.map((mismatch, idx) => (
                  <div key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                    <span className="text-gray-500">•</span>
                    <span>{mismatch}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Invoice ↔ GRN */}
          <div className={`p-4 rounded-lg border-2 ${grnConfig.border} ${grnConfig.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="px-2 py-1 bg-white rounded text-xs font-semibold border-2 border-blue-300">
                    📄 Invoice
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-500" />
                  <div className="px-2 py-1 bg-white rounded text-xs font-semibold border-2 border-blue-300">
                    📦 GRN
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {grnConfig.icon}
                <span className={`font-bold ${grnConfig.text}`}>
                  {matching.invoice_grn_score}/100
                </span>
              </div>
            </div>
            <Progress value={matching.invoice_grn_score} className="h-2 mb-2" />
            {matching.invoice_grn_mismatches.length > 0 && (
              <div className="mt-2 space-y-1">
                {matching.invoice_grn_mismatches.map((mismatch, idx) => (
                  <div key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                    <span className="text-gray-500">•</span>
                    <span>{mismatch}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Score Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-700">
              {matching.invoice_po_score}
            </div>
            <div className="text-xs text-gray-600">Invoice ↔ PO</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-700">
              {matching.invoice_grn_score}
            </div>
            <div className="text-xs text-gray-600">Invoice ↔ GRN</div>
          </div>
        </div>
        
        {/* Gemini Badge */}
        <div className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
          <div className="text-lg">🎯</div>
          <div className="text-xs">
            <div className="font-semibold text-gray-900">Powered by Gemini 2.0 Flash</div>
            <div className="text-gray-600">LLM-based intelligent matching</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
