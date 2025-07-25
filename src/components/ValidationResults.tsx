import React, { useState } from 'react';
import { 
  ValidationSummary, 
  ValidationResult, 
  ValidationFilters, 
  ValidationSort,
  ComplianceReport 
} from '../types/validation';
import './ValidationResults.css';

interface ValidationResultsProps {
  validation: ValidationSummary;
  compliance: ComplianceReport;
  showDetails?: boolean;
  onRuleClick?: (ruleId: string) => void;
  className?: string;
}

const ValidationResults: React.FC<ValidationResultsProps> = ({
  validation,
  compliance,
  showDetails = true,
  onRuleClick,
  className = ''
}) => {
  const [filters, setFilters] = useState<ValidationFilters>({
    severity: 'all',
    category: 'all',
    namespace: 'all',
    passed: 'all'
  });
  const [sort, setSort] = useState<ValidationSort>({
    field: 'severity',
    direction: 'desc'
  });
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());

  // Filter results based on current filters
  const filteredResults = validation.results.filter(result => {
    if (filters.severity !== 'all' && result.severity !== filters.severity) return false;
    if (filters.category !== 'all' && result.category !== filters.category) return false;
    if (filters.namespace !== 'all' && result.namespace !== filters.namespace) return false;
    if (filters.passed !== 'all' && result.passed !== filters.passed) return false;
    return true;
  });

  // Sort results based on current sort
  const sortedResults = [...filteredResults].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sort.field) {
      case 'severity':
        const severityOrder = { error: 3, warning: 2, info: 1 };
        aValue = severityOrder[a.severity];
        bValue = severityOrder[b.severity];
        break;
      case 'category':
        const categoryOrder = { required: 3, recommended: 2, optional: 1 };
        aValue = categoryOrder[a.category];
        bValue = categoryOrder[b.category];
        break;
      case 'namespace':
        aValue = a.namespace;
        bValue = b.namespace;
        break;
      case 'ruleName':
        aValue = a.ruleName.toLowerCase();
        bValue = b.ruleName.toLowerCase();
        break;
      case 'passed':
        aValue = a.passed ? 1 : 0;
        bValue = b.passed ? 1 : 0;
        break;
      default:
        return 0;
    }

    if (sort.direction === 'asc') {
      return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
    } else {
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    }
  });

  const getSeverityColor = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error': return '#dc3545';
      case 'warning': return '#ffc107';
      case 'info': return '#17a2b8';
      default: return '#6c757d';
    }
  };

  const getSeverityIcon = (severity: 'error' | 'warning' | 'info') => {
    switch (severity) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '•';
    }
  };

  const getCategoryColor = (category: 'required' | 'recommended' | 'optional') => {
    switch (category) {
      case 'required': return '#dc3545';
      case 'recommended': return '#ffc107';
      case 'optional': return '#28a745';
      default: return '#6c757d';
    }
  };

  const getNamespaceColor = (namespace: 'rss' | 'itunes' | 'podcast' | 'googleplay') => {
    switch (namespace) {
      case 'rss': return '#007bff';
      case 'itunes': return '#6f42c1';
      case 'podcast': return '#fd7e14';
      case 'googleplay': return '#e83e8c';
      default: return '#6c757d';
    }
  };

  const toggleRuleExpansion = (ruleId: string) => {
    const newExpanded = new Set(expandedRules);
    if (newExpanded.has(ruleId)) {
      newExpanded.delete(ruleId);
    } else {
      newExpanded.add(ruleId);
    }
    setExpandedRules(newExpanded);
  };

  const handleRuleClick = (ruleId: string) => {
    if (onRuleClick) {
      onRuleClick(ruleId);
    }
    toggleRuleExpansion(ruleId);
  };

  return (
    <div className={`validation-results ${className}`}>
      {/* Summary Section */}
      <div className="validation-summary">
        <h3>🔍 Validation Summary</h3>
        <div className="summary-stats">
          <div className="summary-item">
            <span className="summary-number total">{validation.totalRules}</span>
            <span className="summary-label">Total Rules</span>
          </div>
          <div className="summary-item">
            <span className="summary-number passed">{validation.passed}</span>
            <span className="summary-label">Passed</span>
          </div>
          <div className="summary-item">
            <span className="summary-number failed">{validation.failed}</span>
            <span className="summary-label">Failed</span>
          </div>
          <div className="summary-item">
            <span className="summary-number score">{validation.complianceScore}%</span>
            <span className="summary-label">Compliance</span>
          </div>
        </div>

        <div className="severity-breakdown">
          <div className="severity-item error">
            <span className="severity-icon">❌</span>
            <span className="severity-count">{validation.errors}</span>
            <span className="severity-label">Errors</span>
          </div>
          <div className="severity-item warning">
            <span className="severity-icon">⚠️</span>
            <span className="severity-count">{validation.warnings}</span>
            <span className="severity-label">Warnings</span>
          </div>
          <div className="severity-item info">
            <span className="severity-icon">ℹ️</span>
            <span className="severity-count">{validation.info}</span>
            <span className="severity-label">Info</span>
          </div>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="validation-controls">
        <div className="filters">
          <select 
            value={filters.severity} 
            onChange={(e) => setFilters(prev => ({ ...prev, severity: e.target.value as any }))}
            className="filter-select"
          >
            <option value="all">All Severities</option>
            <option value="error">Errors Only</option>
            <option value="warning">Warnings Only</option>
            <option value="info">Info Only</option>
          </select>

          <select 
            value={filters.category} 
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value as any }))}
            className="filter-select"
          >
            <option value="all">All Categories</option>
            <option value="required">Required Only</option>
            <option value="recommended">Recommended Only</option>
            <option value="optional">Optional Only</option>
          </select>

          <select 
            value={filters.namespace} 
            onChange={(e) => setFilters(prev => ({ ...prev, namespace: e.target.value as any }))}
            className="filter-select"
          >
            <option value="all">All Namespaces</option>
            <option value="rss">RSS Only</option>
            <option value="itunes">iTunes Only</option>
            <option value="podcast">Podcasting 2.0 Only</option>
            <option value="googleplay">Google Play Only</option>
          </select>

                     <select 
             value={filters.passed === 'all' ? 'all' : filters.passed ? 'true' : 'false'} 
             onChange={(e) => setFilters(prev => ({ ...prev, passed: e.target.value === 'all' ? 'all' : e.target.value === 'true' }))}
             className="filter-select"
           >
            <option value="all">All Results</option>
            <option value="true">Passed Only</option>
            <option value="false">Failed Only</option>
          </select>
        </div>

        <div className="sort-controls">
          <select 
            value={`${sort.field}-${sort.direction}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split('-');
              setSort({ field: field as any, direction: direction as any });
            }}
            className="sort-select"
          >
            <option value="severity-desc">Severity (High to Low)</option>
            <option value="severity-asc">Severity (Low to High)</option>
            <option value="category-desc">Category (Required to Optional)</option>
            <option value="category-asc">Category (Optional to Required)</option>
            <option value="namespace-asc">Namespace (A-Z)</option>
            <option value="namespace-desc">Namespace (Z-A)</option>
            <option value="ruleName-asc">Rule Name (A-Z)</option>
            <option value="ruleName-desc">Rule Name (Z-A)</option>
            <option value="passed-desc">Status (Failed First)</option>
            <option value="passed-asc">Status (Passed First)</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="results-count">
        Showing {sortedResults.length} of {validation.results.length} rules
        {filters.severity !== 'all' || filters.category !== 'all' || filters.namespace !== 'all' || filters.passed !== 'all' && (
          <button 
            onClick={() => setFilters({ severity: 'all', category: 'all', namespace: 'all', passed: 'all' })}
            className="clear-filters"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Validation Rules */}
      <div className="validation-rules">
        {sortedResults.length === 0 ? (
          <div className="no-results">
            <p>No validation rules match the current filters.</p>
            <button 
              onClick={() => setFilters({ severity: 'all', category: 'all', namespace: 'all', passed: 'all' })}
              className="clear-filters"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          sortedResults.map((result) => (
            <div 
              key={result.ruleId} 
              className={`validation-rule ${result.passed ? 'passed' : 'failed'} ${expandedRules.has(result.ruleId) ? 'expanded' : ''}`}
              style={{ borderLeftColor: getSeverityColor(result.severity) }}
              onClick={() => handleRuleClick(result.ruleId)}
            >
              <div className="rule-header">
                <div className="rule-meta">
                  <span className="rule-icon">{getSeverityIcon(result.severity)}</span>
                  <span className="rule-name">{result.ruleName}</span>
                  <div className="rule-tags">
                    <span 
                      className="rule-tag category" 
                      style={{ backgroundColor: getCategoryColor(result.category) }}
                    >
                      {result.category}
                    </span>
                    <span 
                      className="rule-tag namespace" 
                      style={{ backgroundColor: getNamespaceColor(result.namespace) }}
                    >
                      {result.namespace}
                    </span>
                  </div>
                </div>
                <div className="rule-status">
                  <span className={`status-indicator ${result.passed ? 'passed' : 'failed'}`}>
                    {result.passed ? '✓' : '✗'}
                  </span>
                  <span className="status-text">{result.passed ? 'Passed' : 'Failed'}</span>
                </div>
              </div>

              <div className="rule-content">
                <div className="rule-message">{result.message}</div>
                
                {showDetails && (
                  <div className="rule-details">
                    {result.element && (
                      <div className="detail-item">
                        <strong>Element:</strong> <code>{result.element}</code>
                      </div>
                    )}
                    {result.value && (
                      <div className="detail-item">
                        <strong>Value:</strong> <code>{result.value}</code>
                      </div>
                    )}
                    {result.details && (
                      <div className="detail-item">
                        <strong>Details:</strong> {result.details}
                      </div>
                    )}
                    {result.suggestion && !result.passed && (
                      <div className="rule-suggestion">
                        <strong>💡 Suggestion:</strong> {result.suggestion}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>


    </div>
  );
};

export default ValidationResults; 