/**
 * Extraction Quality Visualization
 * 100% DATA-DRIVEN - Dark theme matching dashboard
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface ExtractionQualityProps {
  qualityScore: number;
  fieldCount: number;
  confidenceScores?: Record<string, number>;
  extractionTime?: number;
  extractedFields?: Record<string, any>; // Actual field data for category calculation
}

export function ExtractionQualityCard({ 
  qualityScore, 
  fieldCount, 
  confidenceScores = {},
  extractionTime,
  extractedFields = {}
}: ExtractionQualityProps) {
  
  // Calculate field category scores from ACTUAL extracted data
  const getFieldCategoryData = (fields: string[]) => {
    // Count how many fields in this category actually have data
    const fieldsWithData = fields.filter(f => {
      const value = extractedFields[f];
      // Consider non-empty values as "extracted"
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'object' && value !== null) return Object.keys(value).length > 0;
      return value !== null && value !== undefined && value !== '' && value !== 0;
    });
    
    if (fieldsWithData.length === 0) return { hasData: false, coverage: 0, count: 0 };
    
    // Calculate coverage percentage
    const coverage = Math.round((fieldsWithData.length / fields.length) * 100);
    
    return { hasData: true, coverage, count: fieldsWithData.length };
  };
  
  const categories = [
    {
      name: 'Vendor Info',
      fields: ['vendor_name', 'vendor_address', 'vendor_tax_id', 'vendor_phone', 'vendor_email'],
      icon: '🏢'
    },
    {
      name: 'Invoice Details',
      fields: ['invoice_number', 'invoice_date', 'po_number', 'due_date'],
      icon: '📄'
    },
    {
      name: 'Amounts',
      fields: ['subtotal', 'tax', 'total', 'amount_due'],
      icon: '💰'
    },
    {
      name: 'Bank Details',
      fields: ['bank_name', 'bank_account', 'routing_number'],
      icon: '🏦'
    },
    {
      name: 'Line Items',
      fields: ['line_items'],
      icon: '📋'
    }
  ];
  
  const getQualityLevel = (score: number) => {
    if (score >= 90) return { label: 'Excellent', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
    if (score >= 80) return { label: 'Good', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' };
    if (score >= 70) return { label: 'Fair', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' };
    return { label: 'Poor', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' };
  };
  
  const qualityLevel = getQualityLevel(qualityScore);
  
  // Calculate categories with actual data
  const categoriesWithData = categories.filter(c => getFieldCategoryData(c.fields).hasData);
  
  return (
    <Card className="bg-white/[0.06] border-white/[0.15] backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <span>Extraction Quality</span>
          <Badge className={`${qualityLevel.bg} ${qualityLevel.color} border ${qualityLevel.border}`}>
            {qualityLevel.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white/80">Overall Quality</span>
            <span className="text-3xl font-bold text-blue-400">{qualityScore}%</span>
          </div>
          <div className="w-full bg-white/[0.08] rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
              style={{ width: `${qualityScore}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-white/40">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="text-xs text-white/60 mb-1">Fields Extracted</div>
            <div className="text-2xl font-bold text-blue-400">{fieldCount}</div>
            <div className="text-xs text-white/40 mt-1">comprehensive extraction</div>
          </div>
          {extractionTime && (
            <div className="p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <div className="text-xs text-white/60 mb-1">Processing Time</div>
              <div className="text-2xl font-bold text-purple-400">{extractionTime.toFixed(2)}s</div>
              <div className="text-xs text-white/40 mt-1">
                <Clock className="inline h-3 w-3 mr-1" />
                LandingAI ADE
              </div>
            </div>
          )}
        </div>
        
        {/* Category Breakdown */}
        <div className="space-y-3">
          <div className="text-sm font-semibold text-white/80 flex items-center gap-2">
            <span>Field Categories</span>
            <Badge variant="outline" className="text-xs bg-white/[0.05] border-white/[0.15] text-white/60">
              {categoriesWithData.length} of {categories.length}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((category) => {
              const categoryData = getFieldCategoryData(category.fields);
              const hasData = categoryData.hasData;
              
              return (
                <div 
                  key={category.name}
                  className={`
                    p-3 rounded-lg border transition-all duration-200
                    ${hasData 
                      ? 'border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/15' 
                      : 'border-white/[0.10] bg-white/[0.03]'}
                  `}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{category.icon}</span>
                      <span className="text-xs font-semibold text-white/80">{category.name}</span>
                    </div>
                    {hasData ? (
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-white/30" />
                    )}
                  </div>
                  {hasData ? (
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-white/60">Coverage</span>
                        <span className="text-sm font-bold text-emerald-400">{categoryData.coverage}%</span>
                      </div>
                      <div className="w-full bg-white/[0.08] rounded-full h-1 overflow-hidden">
                        <div 
                          className="h-full bg-emerald-400 transition-all"
                          style={{ width: `${categoryData.coverage}%` }}
                        />
                      </div>
                      <div className="text-xs text-white/50">
                        {categoryData.count}/{category.fields.length} fields
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-white/40">No data extracted</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* LandingAI Badge */}
        <div className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
          <div className="text-lg">🔍</div>
          <div className="text-xs">
            <div className="font-semibold text-white/90">Powered by LandingAI ADE</div>
            <div className="text-white/60">Agentic Document Extraction</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
