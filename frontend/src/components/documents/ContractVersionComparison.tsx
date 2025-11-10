import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  ArrowLeftRight, 
  Download, 
  GitBranch,
  Clock,
  User,
  CheckCircle,
  AlertTriangle,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface ContractVersion {
  id: string;
  name: string;
  timestamp: Date;
  author: string;
  status: 'original' | 'redlined' | 'final';
  changesSummary: {
    additions: number;
    deletions: number;
    modifications: number;
  };
  content: string;
}

interface ContractVersionComparisonProps {
  document: any;
  analysis: any;
  trackChanges: any[];
}

const ContractVersionComparison: React.FC<ContractVersionComparisonProps> = ({
  document,
  analysis,
  trackChanges = []
}) => {
  const [selectedVersions, setSelectedVersions] = useState<[string, string]>(['original', 'redlined']);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Generate contract versions
  const generateVersions = (): ContractVersion[] => {
    const original: ContractVersion = {
      id: 'original',
      name: 'Original Contract',
      timestamp: new Date(document.createdAt || Date.now()),
      author: 'Client',
      status: 'original',
      changesSummary: { additions: 0, deletions: 0, modifications: 0 },
      content: document.content
    };

    const redlined: ContractVersion = {
      id: 'redlined',
      name: 'AI Redlined Version',
      timestamp: new Date(),
      author: 'Invoice³ AI',
      status: 'redlined',
      changesSummary: {
        additions: trackChanges.filter(c => c.type === 'insertion').length,
        deletions: trackChanges.filter(c => c.type === 'deletion').length,
        modifications: trackChanges.filter(c => c.type === 'modification').length
      },
      content: generateRedlinedContent()
    };

    const final: ContractVersion = {
      id: 'final',
      name: 'Final Approved Version',
      timestamp: new Date(),
      author: 'Legal Team',
      status: 'final',
      changesSummary: {
        additions: trackChanges.filter(c => c.status === 'accepted' && c.type === 'insertion').length,
        deletions: trackChanges.filter(c => c.status === 'accepted' && c.type === 'deletion').length,
        modifications: trackChanges.filter(c => c.status === 'accepted' && c.type === 'modification').length
      },
      content: generateFinalContent()
    };

    return [original, redlined, final];
  };

  const generateRedlinedContent = () => {
    let content = document.content;
    trackChanges.forEach(change => {
      const redlineMarkup = `
<div class="redline-change" data-type="${change.type}">
  <del class="text-red-600 line-through bg-red-50 px-1">${change.originalText}</del>
  <ins class="text-green-600 bg-green-50 px-1 no-underline">${change.newText}</ins>
  <span class="redline-comment text-xs text-gray-500 block italic">💬 ${change.reason}</span>
</div>`;
      content = content.replace(change.originalText, redlineMarkup);
    });
    return content;
  };

  const generateFinalContent = () => {
    let content = document.content;
    trackChanges
      .filter(change => change.status === 'accepted')
      .forEach(change => {
        content = content.replace(change.originalText, change.newText);
      });
    return content;
  };

  const versions = generateVersions();
  const leftVersion = versions.find(v => v.id === selectedVersions[0]);
  const rightVersion = versions.find(v => v.id === selectedVersions[1]);

  const getVersionIcon = (status: string) => {
    switch (status) {
      case 'original': return <FileText className="h-4 w-4 text-blue-600" />;
      case 'redlined': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'final': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getVersionColor = (status: string) => {
    switch (status) {
      case 'original': return 'border-blue-200 bg-blue-50';
      case 'redlined': return 'border-orange-200 bg-orange-50';
      case 'final': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-white p-6' : ''}`}>
      {/* Version Selection */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <GitBranch className="h-5 w-5 text-gray-600" />
            <span className="font-medium">Compare Versions:</span>
          </div>
          
          <select
            value={selectedVersions[0]}
            onChange={(e) => setSelectedVersions([e.target.value, selectedVersions[1]])}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            {versions.map(version => (
              <option key={version.id} value={version.id}>{version.name}</option>
            ))}
          </select>
          
          <ArrowLeftRight className="h-4 w-4 text-gray-400" />
          
          <select
            value={selectedVersions[1]}
            onChange={(e) => setSelectedVersions([selectedVersions[0], e.target.value])}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            {versions.map(version => (
              <option key={version.id} value={version.id}>{version.name}</option>
            ))}
          </select>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Comparison
          </Button>
        </div>
      </div>

      {/* Version Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {versions.map(version => (
          <Card key={version.id} className={`${getVersionColor(version.status)} cursor-pointer transition-all hover:shadow-md`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getVersionIcon(version.status)}
                  <span className="font-medium text-sm">{version.name}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {version.status.toUpperCase()}
                </Badge>
              </div>
              
              <div className="text-xs text-gray-600 mb-3">
                <div className="flex items-center space-x-1">
                  <User className="h-3 w-3" />
                  <span>{version.author}</span>
                </div>
                <div className="flex items-center space-x-1 mt-1">
                  <Clock className="h-3 w-3" />
                  <span>{version.timestamp.toLocaleString()}</span>
                </div>
              </div>
              
              <div className="flex justify-between text-xs">
                <span className="text-green-600">+{version.changesSummary.additions}</span>
                <span className="text-red-600">-{version.changesSummary.deletions}</span>
                <span className="text-blue-600">~{version.changesSummary.modifications}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Side-by-Side Comparison */}
      <div className={`grid grid-cols-2 gap-4 ${isFullscreen ? 'h-[calc(100vh-200px)]' : 'h-96'}`}>
        {/* Left Version */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              {getVersionIcon(leftVersion?.status || '')}
              <span className="ml-2">{leftVersion?.name}</span>
              <Badge variant="outline" className="ml-2 text-xs">
                {leftVersion?.timestamp.toLocaleDateString()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <div className="prose prose-sm max-w-none">
              {leftVersion?.status === 'redlined' ? (
                <div 
                  dangerouslySetInnerHTML={{ __html: leftVersion.content }}
                  className="text-sm leading-relaxed"
                />
              ) : (
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {leftVersion?.content}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Version */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center">
              {getVersionIcon(rightVersion?.status || '')}
              <span className="ml-2">{rightVersion?.name}</span>
              <Badge variant="outline" className="ml-2 text-xs">
                {rightVersion?.timestamp.toLocaleDateString()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <div className="prose prose-sm max-w-none">
              {rightVersion?.status === 'redlined' ? (
                <div 
                  dangerouslySetInnerHTML={{ __html: rightVersion.content }}
                  className="text-sm leading-relaxed"
                />
              ) : (
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {rightVersion?.content}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Change Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Change Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 border border-green-200 bg-green-50 rounded">
              <div className="text-lg font-bold text-green-600">
                +{versions.find(v => v.id === 'redlined')?.changesSummary.additions || 0}
              </div>
              <div className="text-xs text-gray-600">Additions</div>
            </div>
            <div className="p-3 border border-red-200 bg-red-50 rounded">
              <div className="text-lg font-bold text-red-600">
                -{versions.find(v => v.id === 'redlined')?.changesSummary.deletions || 0}
              </div>
              <div className="text-xs text-gray-600">Deletions</div>
            </div>
            <div className="p-3 border border-blue-200 bg-blue-50 rounded">
              <div className="text-lg font-bold text-blue-600">
                ~{versions.find(v => v.id === 'redlined')?.changesSummary.modifications || 0}
              </div>
              <div className="text-xs text-gray-600">Modifications</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContractVersionComparison;
