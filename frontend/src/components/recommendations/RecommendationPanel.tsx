import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronRight,
  FileText,
  CheckCircle2,
  AlertCircle,
  Info,
  BarChart3,
  Shield
} from 'lucide-react';
import RecommendationCard, { ActionableRecommendation } from './RecommendationCard';

interface FinancialSummary {
  totalSavings: number;
  avgRiskReduction: number;
  highPriorityCount: number;
}

interface RecommendationPanelProps {
  recommendations: ActionableRecommendation[];
  financialSummary: FinancialSummary;
  isLoading?: boolean;
}

const RecommendationPanel: React.FC<RecommendationPanelProps> = ({
  recommendations,
  financialSummary,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    critical: true,
    high: true,
    medium: false
  });
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // Filter and group recommendations
  const filteredRecommendations = useMemo(() => {
    return recommendations.filter(rec => {
      const matchesSearch = !searchTerm || 
        rec.rationale.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.section.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rec.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === 'all' || rec.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [recommendations, searchTerm, selectedCategory]);

  const groupedRecommendations = useMemo(() => {
    const groups = {
      critical: filteredRecommendations.filter(r => r.priority === 'high'),
      high: filteredRecommendations.filter(r => r.priority === 'medium'),
      medium: filteredRecommendations.filter(r => r.priority === 'low')
    };
    return groups;
  }, [filteredRecommendations]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-amber-600" />;
      case 'medium':
        return <Info className="h-5 w-5 text-blue-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleCard = (cardId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'risk_mitigation', label: '🛡️ Risk Mitigation' },
    { value: 'compliance', label: '⚖️ Compliance' },
    { value: 'negotiation', label: '🤝 Negotiation' },
    { value: 'term_clarification', label: '📝 Clarification' },
    { value: 'best_practice', label: '⭐ Best Practice' }
  ];

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-12">
          <div className="flex flex-col items-center">
            <div className="animate-spin h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full mb-3"></div>
            <span className="text-sm text-gray-600">Generating recommendations...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" data-testid="recommendation-panel">
      {/* Financial Impact Summary */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
            Financial Impact Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <DollarSign className="h-6 w-6 text-green-600 mr-1" />
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(financialSummary.totalSavings)}
                </span>
              </div>
              <p className="text-sm text-gray-600">Total Potential Savings</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-6 w-6 text-blue-600 mr-1" />
                <span className="text-2xl font-bold text-blue-600">
                  {financialSummary.avgRiskReduction}%
                </span>
              </div>
              <p className="text-sm text-gray-600">Average Risk Reduction</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Shield className="h-6 w-6 text-red-600 mr-1" />
                <span className="text-2xl font-bold text-red-600">
                  {financialSummary.highPriorityCount}
                </span>
              </div>
              <p className="text-sm text-gray-600">Critical Issues</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search recommendations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-recommendations"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="select-category-filter"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations by Priority */}
      <div className="space-y-4">
        {/* Critical Priority Section */}
        {groupedRecommendations.critical.length > 0 && (
          <Card className="border-red-200 bg-red-50/30">
            <Collapsible 
              open={expandedSections.critical} 
              onOpenChange={() => toggleSection('critical')}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-red-50/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <CardTitle className="text-lg font-semibold text-red-800">
                        🔴 Critical Issues
                      </CardTitle>
                      <Badge variant="destructive" className="text-xs">
                        {groupedRecommendations.critical.length}
                      </Badge>
                    </div>
                    {expandedSections.critical ? 
                      <ChevronDown className="h-5 w-5 text-red-600" /> : 
                      <ChevronRight className="h-5 w-5 text-red-600" />
                    }
                  </div>
                  <p className="text-sm text-red-700 text-left">
                    Immediate attention required - High financial or legal risk
                  </p>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-3">
                  {groupedRecommendations.critical.map((rec) => (
                    <RecommendationCard
                      key={rec.id}
                      recommendation={rec}
                      isExpanded={expandedCards[rec.id]}
                      onToggleExpanded={() => toggleCard(rec.id)}
                    />
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}

        {/* High Priority Section */}
        {groupedRecommendations.high.length > 0 && (
          <Card className="border-amber-200 bg-amber-50/30">
            <Collapsible 
              open={expandedSections.high} 
              onOpenChange={() => toggleSection('high')}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-amber-50/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      <CardTitle className="text-lg font-semibold text-amber-800">
                        🟡 High Priority
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs bg-amber-100 text-amber-800">
                        {groupedRecommendations.high.length}
                      </Badge>
                    </div>
                    {expandedSections.high ? 
                      <ChevronDown className="h-5 w-5 text-amber-600" /> : 
                      <ChevronRight className="h-5 w-5 text-amber-600" />
                    }
                  </div>
                  <p className="text-sm text-amber-700 text-left">
                    Important improvements that reduce risk and improve terms
                  </p>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-3">
                  {groupedRecommendations.high.map((rec) => (
                    <RecommendationCard
                      key={rec.id}
                      recommendation={rec}
                      isExpanded={expandedCards[rec.id]}
                      onToggleExpanded={() => toggleCard(rec.id)}
                    />
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}

        {/* Medium Priority Section */}
        {groupedRecommendations.medium.length > 0 && (
          <Card className="border-blue-200 bg-blue-50/30">
            <Collapsible 
              open={expandedSections.medium} 
              onOpenChange={() => toggleSection('medium')}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-blue-50/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Info className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-lg font-semibold text-blue-800">
                        🟢 Medium Priority
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                        {groupedRecommendations.medium.length}
                      </Badge>
                    </div>
                    {expandedSections.medium ? 
                      <ChevronDown className="h-5 w-5 text-blue-600" /> : 
                      <ChevronRight className="h-5 w-5 text-blue-600" />
                    }
                  </div>
                  <p className="text-sm text-blue-700 text-left">
                    Best practices and standard improvements for better clarity
                  </p>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-3">
                  {groupedRecommendations.medium.map((rec) => (
                    <RecommendationCard
                      key={rec.id}
                      recommendation={rec}
                      isExpanded={expandedCards[rec.id]}
                      onToggleExpanded={() => toggleCard(rec.id)}
                    />
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )}
      </div>

      {/* Empty State */}
      {filteredRecommendations.length === 0 && (
        <Card>
          <CardContent className="text-center p-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'Run contract analysis to generate recommendations'
              }
            </p>
            {(searchTerm || selectedCategory !== 'all') && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary Actions */}
      {filteredRecommendations.length > 0 && (
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-sm text-gray-600">
                Showing {filteredRecommendations.length} of {recommendations.length} recommendations
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  Export Report
                </Button>
                <Button size="sm" className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Mark All Complete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RecommendationPanel;