'use client';

import React, { useState, ChangeEvent } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, ChevronDown, Upload } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Lead, 
  SortConfig,
  LeadSortKeys,
  DesignIssue
} from '@/models';

const LeadsDashboard: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const [error, setError] = useState<string>('');
  const itemsPerPage = 10;

  const truncateUrl = (url: string, maxLength: number = 30) => {
    if (url.length <= maxLength) return url;
    const start = url.substring(0, maxLength / 2);
    const end = url.substring(url.length - maxLength / 2);
    return `${start}...${end}`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-yellow-100 text-yellow-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle file upload
  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError('');

      if (!file.name.toLowerCase().endsWith('.json')) {
        setError('Please upload a JSON file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          
          if (!Array.isArray(data)) {
            setError('Invalid data format. Expected an array of leads.');
            return;
          }
          
          // Type validation of the loaded data
          const isValidLead = (item: any): item is Lead => {
            return typeof item.url === 'string';
          };

          if (!data.every(isValidLead)) {
            setError('Some leads in the file are invalid');
            return;
          }

          setLeads(data);
          setFilteredLeads(data);
          setCurrentPage(1);
        } catch (err) {
          setError('Invalid JSON format');
        }
      };
      reader.onerror = () => {
        setError('Error reading file');
      };
      reader.readAsText(file);
    } catch (err) {
      setError('Error processing file');
    }
  };

  // Handle search
  const handleSearch = (searchTerm: string) => {
    setSearch(searchTerm);
    const filtered = leads.filter(lead => {
      const searchLower = searchTerm.toLowerCase();
      const url = (lead.url || '').toLowerCase();
      const businessName = (lead.business_info?.business_name || '').toLowerCase();
      
      return url.includes(searchLower) || businessName.includes(searchLower);
    });
    setFilteredLeads(filtered);
    setCurrentPage(1);
  };

  // Get nested object value by string path
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Sorting function
  const handleSort = (key: LeadSortKeys) => {
    const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    setSortConfig({ key, direction });

    const sorted = [...filteredLeads].sort((a, b) => {
      const aValue = getNestedValue(a, key);
      const bValue = getNestedValue(b, key);

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredLeads(sorted);
  };

  // Pagination calculation
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLeads = filteredLeads.slice(startIndex, endIndex);

  // Render sort indicator
  const renderSortIndicator = (key: LeadSortKeys) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? 
        <ChevronUp className="w-4 h-4 inline" /> : 
        <ChevronDown className="w-4 h-4 inline" />;
    }
    return null;
  };

  // Score styling
  const getScoreColor = (score: number | null | undefined): string => {
    if (score === null || score === undefined) return '';
    if (score < 50) return 'text-red-500';
    if (score < 80) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle>Leads Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        {/* File Upload and Search */}
        <div className="mb-4 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <input
                type="file"
                onChange={handleFileUpload}
                accept=".json"
                className="hidden"
                id="file-upload"
              />
              <Button 
                variant="outline" 
                className="flex items-center space-x-2"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <Upload className="w-4 h-4" />
                <span>Upload JSON</span>
              </Button>
            </div>
            <Input
              placeholder="Search by URL or business name..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Data Summary */}
          {leads.length > 0 && (
            <div className="text-sm text-gray-500">
              Showing {filteredLeads.length} of {leads.length} leads
            </div>
          )}
        </div>

        {/* Table */}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('url')}
                >
                  URL {renderSortIndicator('url')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('pagespeed.performance')}
                >
                  Performance {renderSortIndicator('pagespeed.performance')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('pagespeed.accessibility')}
                >
                  Accessibility {renderSortIndicator('pagespeed.accessibility')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('pagespeed.best_practices')}
                >
                  Best Practices {renderSortIndicator('pagespeed.best_practices')}
                </TableHead>
                <TableHead 
                  className="cursor-pointer"
                  onClick={() => handleSort('pagespeed.seo')}
                >
                  SEO {renderSortIndicator('pagespeed.seo')}
                </TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Issues</TableHead>
                <TableHead>Console Log</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentLeads.map((lead, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    <a 
                      href={lead.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:underline block truncate"
                      title={lead.url}
                    >
                      {truncateUrl(lead.url)}
                    </a>
                    {lead.business_info && (
                      <div className="text-sm text-gray-500">
                        {lead.business_info.business_name}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className={getScoreColor(lead.pagespeed?.performance)}>
                      {lead.pagespeed?.performance!.toFixed(0) || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={getScoreColor(lead.pagespeed?.accessibility)}>
                      {lead.pagespeed?.accessibility!.toFixed(0) || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={getScoreColor(lead.pagespeed?.best_practices)}>
                      {lead.pagespeed?.best_practices?.toFixed(0) || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={getScoreColor(lead.pagespeed?.seo)}>
                      {lead.pagespeed?.seo?.toFixed(0) || 'N/A'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {lead.contact_info?.emails?.map((email, i) => (
                      <div key={i}>
                        <a 
                          href={`mailto:${email}`} 
                          className="text-blue-600 hover:underline"
                        >
                          {email}
                        </a>
                      </div>
                    ))}
                    {lead.contact_info?.phones?.map((phone, i) => (
                      <div key={i}>
                        <a 
                          href={`tel:${phone}`} 
                          className="text-blue-600 hover:underline"
                        >
                          {phone}
                        </a>
                      </div>
                    ))}
                  </TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">
                          Issues ({lead.design_issues?.length || 0})
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Design Issues</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          {lead.design_issues?.map((issue, i) => (
                            <div key={i} className="p-4 border rounded-lg">
                              <div className="flex items-center justify-between">
                                <Badge 
                                  variant="secondary"
                                  className={getSeverityColor(issue.severity)}
                                >
                                  {issue.severity.toUpperCase()}
                                </Badge>
                                <Badge>{issue.type}</Badge>
                              </div>
                              <p className="mt-2">{issue.description}</p>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                  <TableCell>
                    <Button onClick={() => console.log(lead) } >Log</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {filteredLeads.length > 0 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  isActive={currentPage === 1}
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    onClick={() => setCurrentPage(i + 1)}
                    isActive={currentPage === i + 1}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  isActive={currentPage === totalPages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardContent>
    </Card>
  );
};

export default LeadsDashboard;