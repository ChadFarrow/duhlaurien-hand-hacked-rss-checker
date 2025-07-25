// Validation Result Types
export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  category: 'required' | 'recommended' | 'optional';
  namespace: 'rss' | 'itunes' | 'podcast' | 'googleplay';
  check: (feed: any) => ValidationResult;
}

export interface ValidationResult {
  ruleId: string;
  ruleName: string;
  severity: 'error' | 'warning' | 'info';
  category: 'required' | 'recommended' | 'optional';
  namespace: 'rss' | 'itunes' | 'podcast' | 'googleplay';
  passed: boolean;
  message: string;
  details?: string;
  element?: string;
  value?: string;
  suggestion?: string;
}

export interface ValidationSummary {
  totalRules: number;
  passed: number;
  failed: number;
  errors: number;
  warnings: number;
  info: number;
  complianceScore: number;
  results: ValidationResult[];
}

// Feed Analysis Types
export interface FeedAnalysis {
  feedType: 'rss' | 'atom' | 'unknown';
  namespaces: string[];
  metadata: FeedMetadata;
  statistics: FeedStatistics;
  validation: ValidationSummary;
  structure: FeedStructure;
}

export interface FeedMetadata {
  title?: string;
  description?: string;
  link?: string;
  language?: string;
  lastUpdated?: string;
  itemCount: number;
  hasPodcasting20: boolean;
  hasITunes: boolean;
  hasGooglePlay: boolean;
}

export interface FeedStatistics {
  totalItems: number;
  totalDuration: number;
  averageDuration: number;
  hasEnclosures: number;
  hasTranscripts: number;
  hasChapters: number;
  hasFunding: number;
  hasLicense: number;
  hasValue: number;
}

export interface FeedStructure {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
}

// Validation Categories
export interface ValidationCategories {
  required: ValidationResult[];
  recommended: ValidationResult[];
  optional: ValidationResult[];
}

export interface ValidationByNamespace {
  rss: ValidationResult[];
  itunes: ValidationResult[];
  podcast: ValidationResult[];
  googleplay: ValidationResult[];
}

export interface ValidationBySeverity {
  errors: ValidationResult[];
  warnings: ValidationResult[];
  info: ValidationResult[];
}

// Compliance Types
export interface ComplianceReport {
  overallScore: number;
  categoryScores: {
    required: number;
    recommended: number;
    optional: number;
  };
  namespaceScores: {
    rss: number;
    itunes: number;
    podcast: number;
    googleplay: number;
  };
  recommendations: string[];
  criticalIssues: ValidationResult[];
  improvements: ValidationResult[];
}

// Export Types
export interface ValidationExport {
  timestamp: string;
  feedUrl: string;
  analysis: FeedAnalysis;
  compliance: ComplianceReport;
  rawResults: ValidationResult[];
}

// UI Component Types
export interface ValidationDisplayProps {
  validation: ValidationSummary;
  analysis: FeedAnalysis;
  compliance: ComplianceReport;
  showDetails?: boolean;
  onRuleClick?: (ruleId: string) => void;
}

export interface ValidationRuleProps {
  result: ValidationResult;
  showSuggestion?: boolean;
  onClick?: () => void;
}

export interface ComplianceScoreProps {
  score: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

// Filter and Sort Types
export interface ValidationFilters {
  severity?: 'error' | 'warning' | 'info' | 'all';
  category?: 'required' | 'recommended' | 'optional' | 'all';
  namespace?: 'rss' | 'itunes' | 'podcast' | 'googleplay' | 'all';
  passed?: boolean | 'all';
}

export interface ValidationSort {
  field: 'severity' | 'category' | 'namespace' | 'ruleName' | 'passed';
  direction: 'asc' | 'desc';
}

// Search Types
export interface ValidationSearch {
  query: string;
  fields: ('ruleName' | 'message' | 'element' | 'suggestion')[];
  caseSensitive: boolean;
}

// Progress Types
export interface ValidationProgress {
  current: number;
  total: number;
  percentage: number;
  currentRule?: string;
  status: 'idle' | 'running' | 'completed' | 'error';
}

// Error Types
export interface ValidationError {
  code: string;
  message: string;
  details?: string;
  ruleId?: string;
  element?: string;
}

// Configuration Types
export interface ValidationConfig {
  enableDetailedResults: boolean;
  includeSuggestions: boolean;
  maxResults: number;
  timeout: number;
  retryAttempts: number;
  customRules: ValidationRule[];
}

// Rule Definition Types
export interface RuleDefinition {
  id: string;
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  category: 'required' | 'recommended' | 'optional';
  namespace: 'rss' | 'itunes' | 'podcast' | 'googleplay';
  enabled: boolean;
  custom?: boolean;
  documentation?: string;
  examples?: {
    valid: string;
    invalid: string;
  };
}

// Batch Validation Types
export interface BatchValidationRequest {
  feeds: string[];
  config: ValidationConfig;
  callback?: (result: BatchValidationResult) => void;
}

export interface BatchValidationResult {
  requestId: string;
  timestamp: string;
  totalFeeds: number;
  completedFeeds: number;
  failedFeeds: number;
  results: {
    [feedUrl: string]: {
      success: boolean;
      analysis?: FeedAnalysis;
      error?: string;
    };
  };
  summary: {
    averageComplianceScore: number;
    bestPerformingFeed?: string;
    worstPerformingFeed?: string;
    commonIssues: ValidationResult[];
  };
}

// Real-time Validation Types
export interface RealTimeValidation {
  isEnabled: boolean;
  interval: number;
  lastCheck: string;
  nextCheck: string;
  changes: ValidationChange[];
}

export interface ValidationChange {
  timestamp: string;
  ruleId: string;
  oldStatus: boolean;
  newStatus: boolean;
  message: string;
}

// Notification Types
export interface ValidationNotification {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  ruleId?: string;
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    handler: () => void;
  };
}

// History Types
export interface ValidationHistory {
  entries: ValidationHistoryEntry[];
  totalEntries: number;
  lastUpdated: string;
}

export interface ValidationHistoryEntry {
  id: string;
  timestamp: string;
  feedUrl: string;
  complianceScore: number;
  totalRules: number;
  passedRules: number;
  failedRules: number;
  summary: ValidationSummary;
}

// Comparison Types
export interface FeedComparison {
  feeds: {
    [feedUrl: string]: FeedAnalysis;
  };
  differences: ValidationDifference[];
  recommendations: string[];
}

export interface ValidationDifference {
  ruleId: string;
  ruleName: string;
  feeds: {
    [feedUrl: string]: {
      passed: boolean;
      value?: string;
    };
  };
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
} 