import React, { useState } from 'react';
import { LabResult, VitalSign } from '@/types/health';
import { ChevronDown, ChevronUp, Search, Filter, Download, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface HealthSummaryTableProps {
  vitals: VitalSign[];
  labResults: LabResult[];
}

type SortField = 'name' | 'value' | 'status' | 'category';
type SortDirection = 'asc' | 'desc';

const HealthSummaryTable: React.FC<HealthSummaryTableProps> = ({ vitals, labResults }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('category');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Combine vitals and lab results into unified format
  const allResults = [
    ...vitals.map(v => ({
      name: v.name,
      value: String(v.value),
      unit: v.unit,
      status: v.status === 'optimal' ? 'normal' : v.status,
      normalRange: v.normalRange,
      category: 'Vitals',
      description: v.description,
      trend: 'stable' as const
    })),
    ...labResults.map(r => ({
      name: r.name,
      value: String(r.value),
      unit: r.unit,
      status: r.status,
      normalRange: r.normalRange,
      category: r.category,
      description: r.description,
      trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable' as 'up' | 'down' | 'stable'
    }))
  ];

  const categories = ['all', ...new Set(allResults.map(r => r.category))];

  // Filter and sort
  const filteredResults = allResults
    .filter(r => {
      const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           r.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || r.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') comparison = a.name.localeCompare(b.name);
      else if (sortField === 'value') comparison = parseFloat(a.value) - parseFloat(b.value);
      else if (sortField === 'status') comparison = a.status.localeCompare(b.status);
      else if (sortField === 'category') comparison = a.category.localeCompare(b.category);
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'optimal': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'low': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'warning': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-amber-400" />;
      default: return <Minus className="w-4 h-4 text-slate-400" />;
    }
  };

  const exportData = () => {
    const csv = [
      ['Name', 'Value', 'Unit', 'Status', 'Normal Range', 'Category'].join(','),
      ...filteredResults.map(r => 
        [r.name, r.value, r.unit, r.status, `"${r.normalRange}"`, r.category].join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'health-results.csv';
    a.click();
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-lg font-semibold text-white">Complete Health Summary</h3>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search results..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 text-sm w-48"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="pl-9 pr-8 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500 text-sm appearance-none cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Export */}
            <button
              onClick={exportData}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-700/30">
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  Test Name
                  {sortField === 'name' && (sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                </div>
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('value')}
              >
                <div className="flex items-center gap-1">
                  Value
                  {sortField === 'value' && (sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Reference Range
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center gap-1">
                  Status
                  {sortField === 'status' && (sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                Trend
              </th>
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                onClick={() => handleSort('category')}
              >
                <div className="flex items-center gap-1">
                  Category
                  {sortField === 'category' && (sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {filteredResults.map((result, index) => (
              <React.Fragment key={`${result.name}-${index}`}>
                <tr 
                  className="hover:bg-slate-700/30 cursor-pointer transition-colors"
                  onClick={() => setExpandedRow(expandedRow === result.name ? null : result.name)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium">{result.name}</span>
                      {expandedRow === result.name ? 
                        <ChevronUp className="w-4 h-4 text-slate-400" /> : 
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      }
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-white font-semibold">{result.value}</span>
                    <span className="text-slate-400 ml-1 text-sm">{result.unit}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">
                    {result.normalRange}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${getStatusColor(result.status)}`}>
                      {result.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {getTrendIcon(result.trend)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2.5 py-1 bg-slate-700/50 text-slate-300 rounded-full text-xs">
                      {result.category}
                    </span>
                  </td>
                </tr>
                {expandedRow === result.name && (
                  <tr className="bg-slate-700/20">
                    <td colSpan={6} className="px-4 py-4">
                      <div className="text-sm text-slate-300 leading-relaxed">
                        <strong className="text-cyan-400">Clinical Interpretation:</strong> {result.description}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700/50 bg-slate-700/20">
        <p className="text-sm text-slate-400">
          Showing {filteredResults.length} of {allResults.length} results
        </p>
      </div>
    </div>
  );
};

export default HealthSummaryTable;
