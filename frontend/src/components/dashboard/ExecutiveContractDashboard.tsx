import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Shield, 
  Clock, 
  DollarSign,
  FileText,
  CheckCircle,
  AlertTriangle,
  Users,
  Target,
  BarChart3,
  ArrowUpRight,
  Download
} from 'lucide-react';

interface ExecutiveMetrics {
  totalContracts: number;
  totalTimesSaved: number; // hours
  totalCostSavings: number; // dollars
  risksIdentified: number;
  risksMitigated: number;
  averageProcessingTime: number; // minutes
  complianceScore: number; // percentage
  monthOverMonthGrowth: number; // percentage
}

interface ExecutiveContractDashboardProps {
  metrics?: ExecutiveMetrics;
  recentActivities?: Array<{
    id: string;
    type: 'analysis' | 'export' | 'risk_mitigation';
    document: string;
    timestamp: Date;
    impact: string;
  }>;
}

const ExecutiveContractDashboard: React.FC<ExecutiveContractDashboardProps> = ({
  metrics = {
    totalContracts: 157,
    totalTimesSaved: 234,
    totalCostSavings: 125000,
    risksIdentified: 89,
    risksMitigated: 76,
    averageProcessingTime: 12,
    complianceScore: 94,
    monthOverMonthGrowth: 23
  },
  recentActivities = [
    {
      id: '1',
      type: 'analysis',
      document: 'Enterprise SLA - Northwind Financial',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      impact: 'Identified 3 high-risk clauses, saved 4.5 hours'
    },
    {
      id: '2', 
      type: 'risk_mitigation',
      document: 'Employment Agreement - Senior Developer',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      impact: 'Prevented potential $15K liability exposure'
    },
    {
      id: '3',
      type: 'export',
      document: 'Commercial Real Estate Lease',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
      impact: 'Clean contract ready for signature'
    }
  ]
}) => {

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'analysis': return <BarChart3 className="h-4 w-4 text-blue-600" />;
      case 'export': return <Download className="h-4 w-4 text-green-600" />;
      case 'risk_mitigation': return <Shield className="h-4 w-4 text-red-600" />;
      default: return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Executive Summary Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoice³ Executive Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time contract analysis impact and ROI metrics</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Badge variant="secondary" className="px-3 py-1">
            <TrendingUp className="h-3 w-3 mr-1" />
            +{metrics.monthOverMonthGrowth}% MoM Growth
          </Badge>
        </div>
      </div>

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Time Savings */}
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Time Saved</p>
                <p className="text-3xl font-bold text-green-600">{metrics.totalTimesSaved}</p>
                <p className="text-sm text-gray-500">hours this quarter</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600 font-medium">18% increase</span>
              <span className="text-gray-500 ml-1">vs last quarter</span>
            </div>
          </CardContent>
        </Card>

        {/* Cost Savings */}
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cost Savings</p>
                <p className="text-3xl font-bold text-blue-600">{formatCurrency(metrics.totalCostSavings)}</p>
                <p className="text-sm text-gray-500">prevented losses</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <ArrowUpRight className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-blue-600 font-medium">$23K average</span>
              <span className="text-gray-500 ml-1">per contract</span>
            </div>
          </CardContent>
        </Card>

        {/* Risk Management */}
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Risks Mitigated</p>
                <p className="text-3xl font-bold text-red-600">{metrics.risksMitigated}</p>
                <p className="text-sm text-gray-500">of {metrics.risksIdentified} identified</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Target className="h-4 w-4 text-red-500 mr-1" />
              <span className="text-red-600 font-medium">{Math.round((metrics.risksMitigated / metrics.risksIdentified) * 100)}% success rate</span>
            </div>
          </CardContent>
        </Card>

        {/* Processing Efficiency */}
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Processing Time</p>
                <p className="text-3xl font-bold text-purple-600">{metrics.averageProcessingTime}</p>
                <p className="text-sm text-gray-500">minutes per contract</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-purple-500 mr-1" />
              <span className="text-purple-600 font-medium">95% under 15 min</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ROI Breakdown & Business Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ROI Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
              Return on Investment Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-medium text-gray-700">Total Cost Savings</span>
                <span className="font-bold text-green-600">{formatCurrency(metrics.totalCostSavings)}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                <span className="font-medium text-gray-700">Time Value (@ $150/hr)</span>
                <span className="font-bold text-blue-600">{formatCurrency(metrics.totalTimesSaved * 150)}</span>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                <span className="font-medium text-gray-700">Risk Prevention Value</span>
                <span className="font-bold text-purple-600">{formatCurrency(metrics.risksMitigated * 2500)}</span>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total ROI</span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatCurrency(metrics.totalCostSavings + (metrics.totalTimesSaved * 150) + (metrics.risksMitigated * 2500))}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {Math.round(((metrics.totalCostSavings + (metrics.totalTimesSaved * 150)) / 50000) * 100)}% ROI on Invoice³ investment
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contract Processing Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 text-blue-600 mr-2" />
              Contract Processing Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-yellow-400 mr-3"></div>
                  <span className="font-medium">Under Review</span>
                </div>
                <Badge variant="secondary">23 contracts</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-blue-500 mr-3"></div>
                  <span className="font-medium">AI Processing</span>
                </div>
                <Badge variant="secondary">8 contracts</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-3"></div>
                  <span className="font-medium">Ready for Signature</span>
                </div>
                <Badge variant="secondary">12 contracts</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-3"></div>
                  <span className="font-medium">High Risk - Needs Review</span>
                </div>
                <Badge variant="destructive">5 contracts</Badge>
              </div>
            </div>
            
            <div className="mt-6 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Average contract cycle time</div>
              <div className="text-2xl font-bold text-gray-900">3.2 days</div>
              <div className="text-sm text-green-600">65% faster than manual process</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-gray-600 mr-2" />
              Recent Contract Activities
            </div>
            <Button variant="ghost" size="sm">View All</Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{activity.document}</h4>
                    <span className="text-xs text-gray-500">
                      {activity.timestamp.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{activity.impact}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Compliance & Quality Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600 mb-1">{metrics.complianceScore}%</div>
            <div className="text-sm text-gray-600">Compliance Score</div>
            <div className="text-xs text-gray-500 mt-2">Industry benchmark: 87%</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600 mb-1">99.2%</div>
            <div className="text-sm text-gray-600">Accuracy Rate</div>
            <div className="text-xs text-gray-500 mt-2">AI clause detection</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-600 mb-1">47</div>
            <div className="text-sm text-gray-600">Legal Team Hours</div>
            <div className="text-xs text-gray-500 mt-2">Freed up this month</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ExecutiveContractDashboard;
