/**
 * Fraud Risk Visualization
 * Shows risk score, level, and detected signals
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Shield, AlertCircle, XCircle } from 'lucide-react';

interface FraudSignal {
  type: string;
  severity: string;
  description: string;
  risk_points: number;
}

interface FraudResult {
  risk_score: number;
  risk_level: string;
  signals: FraudSignal[];
  checks_performed: {
    bank_changed: boolean;
    is_duplicate: boolean;
    amount_anomaly: boolean;
    velocity_issue: boolean;
  };
}

interface FraudRiskCardProps {
  fraud: FraudResult;
}

export function FraudRiskCard({ fraud }: FraudRiskCardProps) {
  const getRiskConfig = (level: string) => {
    switch (level) {
      case 'LOW':
        return {
          color: 'text-green-700',
          bg: 'bg-green-50',
          border: 'border-green-300',
          badge: 'bg-green-100 text-green-800',
          icon: <CheckCircle className="h-6 w-6 text-green-600" />,
          gaugeColor: '#10b981'
        };
      case 'MEDIUM':
        return {
          color: 'text-yellow-700',
          bg: 'bg-yellow-50',
          border: 'border-yellow-300',
          badge: 'bg-yellow-100 text-yellow-800',
          icon: <AlertCircle className="h-6 w-6 text-yellow-600" />,
          gaugeColor: '#f59e0b'
        };
      case 'HIGH':
        return {
          color: 'text-orange-700',
          bg: 'bg-orange-50',
          border: 'border-orange-300',
          badge: 'bg-orange-100 text-orange-800',
          icon: <AlertTriangle className="h-6 w-6 text-orange-600" />,
          gaugeColor: '#f97316'
        };
      case 'CRITICAL':
        return {
          color: 'text-red-700',
          bg: 'bg-red-50',
          border: 'border-red-300',
          badge: 'bg-red-100 text-red-800',
          icon: <XCircle className="h-6 w-6 text-red-600" />,
          gaugeColor: '#ef4444'
        };
      default:
        return {
          color: 'text-gray-700',
          bg: 'bg-gray-50',
          border: 'border-gray-300',
          badge: 'bg-gray-100 text-gray-800',
          icon: <Shield className="h-6 w-6 text-gray-600" />,
          gaugeColor: '#6b7280'
        };
    }
  };
  
  const riskConfig = getRiskConfig(fraud.risk_level);
  const circumference = 2 * Math.PI * 70; // Circle circumference
  const scoreOffset = circumference - (fraud.risk_score / 100) * circumference;
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 text-red-800 border-red-300';
      case 'HIGH': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'LOW': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Fraud Risk Analysis</span>
          <Badge className={`${riskConfig.badge} border-2`}>
            {fraud.risk_level} RISK
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Risk Gauge */}
        <div className={`p-6 rounded-lg border-2 ${riskConfig.border} ${riskConfig.bg}`}>
          <div className="flex items-center justify-center">
            <div className="relative">
              {/* SVG Gauge */}
              <svg className="w-40 h-40 transform -rotate-90">
                {/* Background circle */}
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                  fill="none"
                />
                {/* Progress circle */}
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke={riskConfig.gaugeColor}
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={scoreOffset}
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              {/* Center text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className={`text-4xl font-bold ${riskConfig.color}`}>
                  {fraud.risk_score}
                </div>
                <div className="text-sm text-gray-600">/ 100</div>
              </div>
            </div>
          </div>
          <div className="mt-4 text-center">
            <div className={`inline-flex items-center gap-2 ${riskConfig.color} font-semibold`}>
              {riskConfig.icon}
              <span>{fraud.risk_level} Risk Level</span>
            </div>
          </div>
        </div>
        
        {/* Security Checks */}
        <div className="space-y-3">
          <div className="text-sm font-semibold text-gray-700">Security Checks Performed</div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(fraud.checks_performed).map(([check, passed]) => {
              const checkLabels: Record<string, string> = {
                bank_changed: '🏦 Bank Account',
                is_duplicate: '📋 Duplicate',
                amount_anomaly: '💰 Amount',
                velocity_issue: '⚡ Velocity'
              };
              
              return (
                <div
                  key={check}
                  className={`flex items-center gap-2 p-2 rounded border ${
                    passed 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-green-50 border-green-200'
                  }`}
                >
                  {passed ? (
                    <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  )}
                  <span className="text-xs font-medium text-gray-700">
                    {checkLabels[check] || check}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Fraud Signals */}
        {fraud.signals.length > 0 ? (
          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span>Detected Signals</span>
              <Badge variant="outline" className="text-xs">
                {fraud.signals.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {fraud.signals.map((signal, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border-2 ${
                    signal.severity === 'CRITICAL' ? 'border-red-300 bg-red-50' :
                    signal.severity === 'HIGH' ? 'border-orange-300 bg-orange-50' :
                    signal.severity === 'MEDIUM' ? 'border-yellow-300 bg-yellow-50' :
                    'border-green-300 bg-green-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs ${getSeverityColor(signal.severity)} border`}>
                        {signal.type.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <div className="text-sm font-bold text-gray-700">
                      +{signal.risk_points} pts
                    </div>
                  </div>
                  <p className="text-xs text-gray-700 mt-2">
                    {signal.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-semibold">No fraud signals detected</span>
            </div>
            <p className="text-xs text-green-600 mt-1">
              All security checks passed successfully
            </p>
          </div>
        )}
        
        {/* Risk Breakdown */}
        {fraud.risk_score > 0 && (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 bg-gray-50 rounded border">
              <div className="text-xs text-gray-600">Total Checks</div>
              <div className="text-lg font-bold text-gray-900">
                {Object.keys(fraud.checks_performed).length}
              </div>
            </div>
            <div className="p-2 bg-gray-50 rounded border">
              <div className="text-xs text-gray-600">Signals</div>
              <div className="text-lg font-bold text-gray-900">
                {fraud.signals.length}
              </div>
            </div>
            <div className="p-2 bg-gray-50 rounded border">
              <div className="text-xs text-gray-600">Risk Points</div>
              <div className="text-lg font-bold text-gray-900">
                {fraud.risk_score}
              </div>
            </div>
          </div>
        )}
        
        {/* Gemini Badge */}
        <div className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg border border-red-200">
          <div className="text-lg">🛡️</div>
          <div className="text-xs">
            <div className="font-semibold text-gray-900">Powered by Gemini 2.0 Flash</div>
            <div className="text-gray-600">AI-powered fraud detection</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
