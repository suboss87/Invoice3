import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  FileText, 
  Search, 
  BookOpen, 
  Upload, 
  AlertCircle, 
  CheckCircle, 
  Eye, 
  Clock,
  ArrowRight,
  GitBranch, 
  MessageCircle,
  Database,
  Users,
  Headphones,
  Server
} from 'lucide-react';
import { fetchDocuments, fetchDocumentAnalyses } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Logo from '../components/layout/Logo';

const Dashboard: React.FC = () => {

  // Fetch recent documents
  const { 
    data: documents = [], 
    isLoading: isLoadingDocuments 
  } = useQuery({ 
    queryKey: ['/api/documents'], 
    queryFn: fetchDocuments 
  });

  // Fetch document analyses
  const { 
    data: analyses = [], 
    isLoading: isLoadingAnalyses 
  } = useQuery({ 
    queryKey: ['/api/document-analyses'], 
    queryFn: fetchDocumentAnalyses 
  });

  // Get most recent documents (up to 3)
  const recentDocuments = [...documents].sort((a, b) => {
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  }).slice(0, 3);

  // Format today's date in "MM/DD/YYYY" format
  const today = new Date();
  const formattedDate = `${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}/${today.getFullYear()}`;

  // Create realistic contract samples aligned with playbook types
  const documentNames = [
    { id: 12, title: "Master Service Agreement - Cloud Vendor", date: formattedDate, type: "Vendor Agreement", status: "high_risk", risk: "Unlimited liability caps favor vendor" },
    { id: 11, title: "SaaS Subscription Agreement - Salesforce", date: formattedDate, type: "SaaS Contract", status: "needs_review", risk: "No SLA remedies for downtime" },
    { id: 6, title: "Employment Agreement - Senior Developer", date: formattedDate, type: "Employment Contract", status: "medium_risk", risk: "Overly broad non-compete restrictions" }
  ];

  // Create a combined type for displayed documents
  type DisplayedDocument = {
    id: number;
    title: string;
    date?: string;
    createdAt?: string | Date;
    type: string;
    status?: string;
    risk?: string;
  };

  // Use actual documents if they exist, otherwise use the simulated ones
  const displayedDocuments: DisplayedDocument[] = recentDocuments.length > 0 ? recentDocuments : documentNames;

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-8 md:px-6 md:py-10 bg-slate-50">
      <div className="mb-8 flex items-center">
        <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Upload className="h-6 w-6 text-slate-700" />
              </div>
              <h3 className="font-medium mb-2">Upload Document</h3>
              <p className="text-sm text-slate-500 mb-4">Upload contracts for analysis</p>
              <Button asChild className="w-full justify-center bg-slate-800 hover:bg-slate-700">
                <Link href="/upload-document">Upload Now</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex flex-col items-start">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mb-3">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-sm font-medium text-slate-500">Documents</p>
              <h3 className="text-3xl font-semibold mt-1">
                {documents.length || 7}
              </h3>
            </div>
          </CardContent>
        </Card>
          
        <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex flex-col items-start">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center mb-3">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <p className="text-sm font-medium text-slate-500">Issues Requiring Review</p>
              <h3 className="text-3xl font-semibold mt-1">
                {analyses.reduce((count, analysis) => {
                  const criticalCount = analysis.clausesFound?.filter(clause => 
                    ['critical', 'high', 'moderate'].includes(clause.risk_level || '')
                  ).length || 0;
                  return count + criticalCount;
                }, 0)}
              </h3>
            </div>
          </CardContent>
        </Card>
          
        <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex flex-col items-start">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-sm font-medium text-slate-500">Total Time Saved</p>
              <h3 className="text-3xl font-semibold mt-1">
                {(() => {
                  // Calculate time savings based on analyses
                  const totalClauses = analyses.reduce((count, analysis) => {
                    return count + (analysis.clausesFound?.length || 0);
                  }, 0);
                  
                  const totalDocuments = analyses.length;
                  
                  // Estimate time savings: 3 minutes per clause analyzed, 30 minutes per document
                  const clauseTimeSavings = totalClauses * 3; // 3 minutes per clause
                  const documentTimeSavings = totalDocuments * 30; // 30 minutes per document
                  const totalMinutes = clauseTimeSavings + documentTimeSavings;
                  
                  if (totalMinutes >= 60) {
                    const hours = Math.floor(totalMinutes / 60);
                    const remainingMinutes = totalMinutes % 60;
                    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
                  } else {
                    return totalMinutes > 0 ? `${totalMinutes}m` : '0m';
                  }
                })()}
              </h3>
              {(() => {
                const totalClauses = analyses.reduce((count, analysis) => {
                  return count + (analysis.clausesFound?.length || 0);
                }, 0);
                const totalDocuments = analyses.length;
                const avgTimePerDoc = totalDocuments > 0 ? Math.round((totalClauses * 3 + totalDocuments * 30) / totalDocuments) : 0;
                
                return totalClauses > 0 && (
                  <p className="text-xs text-green-600 font-medium mt-1">
                    {totalClauses} clauses • {totalDocuments} documents • avg {avgTimePerDoc}m/doc
                  </p>
                );
              })()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Documents */}
      <Card className="border border-slate-200 bg-white shadow-sm mb-8">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold">Recent Documents</CardTitle>
          <CardDescription>Recently uploaded legal documents for analysis</CardDescription>
        </CardHeader>
          
        <CardContent>
          {isLoadingDocuments ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-md" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              {displayedDocuments.map((doc) => (
                <div key={doc.id} className="py-4 border-b border-slate-100 last:border-0 flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 text-slate-600">
                        <FileText className="h-10 w-10 text-slate-400" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-slate-900">{doc.title}</h4>
                      <p className="text-sm text-slate-500">
                        {doc.date || (doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : formattedDate)} • {doc.type}
                      </p>
                      {doc.risk && (
                        <p className="text-xs text-red-600 mt-1">⚠️ {doc.risk}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge 
                      variant={doc.status === 'high_risk' ? 'destructive' : doc.status === 'medium_risk' ? 'secondary' : 'outline'} 
                      className="rounded-full text-xs font-medium py-1 px-3"
                    >
                      {doc.status === 'high_risk' ? 'high risk' : doc.status === 'medium_risk' ? 'medium risk' : 'needs review'}
                    </Badge>
                    <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-slate-100">
                      <Link href={`/contracts/${doc.id}`}>
                        <Eye className="h-5 w-5 text-slate-600" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions Heading */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Quick Actions</h2>
        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 font-medium">
          View all features
        </Button>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex flex-col h-full">
              <div className="mb-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-blue-700" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Clause Finding & Redlining</h3>
              <p className="text-slate-600 text-sm mb-4 flex-grow">
                Instantly find and redline critical contract clauses with AI precision
              </p>
              <div className="flex justify-end items-center mt-2">
                <Button asChild variant="ghost" className="justify-start w-fit mt-auto group text-blue-700">
                  <Link href="/documents" className="flex items-center">
                    Open
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex flex-col h-full">
              <div className="mb-4">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-purple-700" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Knowledge Base</h3>
              <p className="text-slate-600 text-sm mb-4 flex-grow">
                Expert contract strategies and negotiation tactics
              </p>
              <div className="flex justify-end items-center mt-2">
                <Button asChild variant="ghost" className="justify-start w-fit mt-auto group text-purple-700">
                  <Link href="/knowledge-base" className="flex items-center">
                    Open
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardContent className="p-6">
            <div className="flex flex-col h-full">
              <div className="mb-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-green-700" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Integrations</h3>
              <p className="text-slate-600 text-sm mb-4 flex-grow">
                Connect your tools and automate contract workflows
              </p>
              <div className="flex justify-end items-center mt-2">
                <Button asChild variant="ghost" className="justify-start w-fit mt-auto group text-green-700">
                  <Link href="/integrations" className="flex items-center">
                    Open
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Enhanced Features */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-slate-900">Enhanced Features</h2>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          New
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="border border-slate-200 bg-gradient-to-br from-slate-800 to-slate-900 shadow-md hover:shadow-lg transition-shadow duration-200 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col h-full">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center mr-3">
                  <GitBranch className="h-5 w-5 text-blue-400" />
                </div>
                <Badge className="bg-blue-900 text-blue-200 border-blue-700">New</Badge>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Advanced Redlining</h3>
              <p className="text-slate-300 text-sm mb-4 flex-grow">
                AI-powered clause replacement suggestions with side-by-side comparison and Word export with tracked changes
              </p>
              <Button variant="outline" className="w-full border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white">
                Coming Soon
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-gradient-to-br from-slate-800 to-slate-900 shadow-md hover:shadow-lg transition-shadow duration-200 text-white">
          <CardContent className="p-6">
            <div className="flex flex-col h-full">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center mr-3">
                  <MessageCircle className="h-5 w-5 text-purple-400" />
                </div>
                <Badge className="bg-purple-900 text-purple-200 border-purple-700">New</Badge>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Risk Analytics</h3>
              <p className="text-slate-300 text-sm mb-4 flex-grow">
                Portfolio-wide contract risk analysis with trend monitoring and compliance alerts for enterprise teams
              </p>
              <Button variant="outline" className="w-full border-slate-600 text-slate-200 hover:bg-slate-700 hover:text-white">
                Coming Soon
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      

    </div>
  );
};

export default Dashboard;
