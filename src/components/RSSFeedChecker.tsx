import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { feedParserService } from '../services/FeedParserService';
import { podcasting20Validator } from '../services/Podcasting20Validator';
// import { podcastIndexService } from '../services/PodcastIndexService';
import { 
  FeedAnalysis, 
  ValidationSummary, 
  ComplianceReport,
  ValidationProgress 
} from '../types/validation';
import { RSSFeed } from '../types/feed';
import EpisodeList from './EpisodeList';
import './RSSFeedChecker.css';

const RSSFeedChecker: React.FC = () => {
  const [feedUrl, setFeedUrl] = useState('');
  const [useManualUrl, setUseManualUrl] = useState(false);
  const [analysis, setAnalysis] = useState<FeedAnalysis | null>(null);
  const [validation, setValidation] = useState<ValidationSummary | null>(null);
  const [compliance, setCompliance] = useState<ComplianceReport | null>(null);
  const [feedData, setFeedData] = useState<RSSFeed | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<ValidationProgress>({
    current: 0,
    total: 0,
    percentage: 0,
    status: 'idle'
  });



  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'Enter':
            event.preventDefault();
            if (!loading) {
              fetchAndAnalyzeFeed();
            }
            break;
          case 'k':
            event.preventDefault();
            const input = document.querySelector('.feed-url-input') as HTMLInputElement;
            if (input) {
              input.focus();
              input.select();
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [loading]);

  const generateComplianceReport = (validation: ValidationSummary): ComplianceReport => {
    const results = validation.results;
    
    // Calculate category scores
    const requiredResults = results.filter(r => r.category === 'required');
    const recommendedResults = results.filter(r => r.category === 'recommended');
    const optionalResults = results.filter(r => r.category === 'optional');
    
    const requiredScore = requiredResults.length > 0 
      ? Math.round((requiredResults.filter(r => r.passed).length / requiredResults.length) * 100)
      : 100;
    const recommendedScore = recommendedResults.length > 0
      ? Math.round((recommendedResults.filter(r => r.passed).length / recommendedResults.length) * 100)
      : 100;
    const optionalScore = optionalResults.length > 0
      ? Math.round((optionalResults.filter(r => r.passed).length / optionalResults.length) * 100)
      : 100;

    // Calculate namespace scores
    const rssResults = results.filter(r => r.namespace === 'rss');
    const itunesResults = results.filter(r => r.namespace === 'itunes');
    const podcastResults = results.filter(r => r.namespace === 'podcast');
    const googleplayResults = results.filter(r => r.namespace === 'googleplay');

    const rssScore = rssResults.length > 0 
      ? Math.round((rssResults.filter(r => r.passed).length / rssResults.length) * 100)
      : 100;
    const itunesScore = itunesResults.length > 0
      ? Math.round((itunesResults.filter(r => r.passed).length / itunesResults.length) * 100)
      : 100;
    const podcastScore = podcastResults.length > 0
      ? Math.round((podcastResults.filter(r => r.passed).length / podcastResults.length) * 100)
      : 100;
    const googleplayScore = googleplayResults.length > 0
      ? Math.round((googleplayResults.filter(r => r.passed).length / googleplayResults.length) * 100)
      : 100;

    // Generate recommendations
    const criticalIssues = results.filter(r => r.severity === 'error' && !r.passed);
    const improvements = results.filter(r => r.severity === 'warning' && !r.passed);
    
    const recommendations: string[] = [];
    if (criticalIssues.length > 0) {
      recommendations.push(`Fix ${criticalIssues.length} critical issues to improve compliance`);
    }
    if (improvements.length > 0) {
      recommendations.push(`Address ${improvements.length} recommended improvements`);
    }
    if (validation.complianceScore >= 90) {
      recommendations.push('Excellent compliance! Consider adding optional features for enhanced user experience');
    } else if (validation.complianceScore >= 70) {
      recommendations.push('Good compliance. Focus on recommended improvements');
    } else {
      recommendations.push('Focus on critical issues first, then address recommended improvements');
    }

    return {
      overallScore: validation.complianceScore,
      categoryScores: {
        required: requiredScore,
        recommended: recommendedScore,
        optional: optionalScore
      },
      namespaceScores: {
        rss: rssScore,
        itunes: itunesScore,
        podcast: podcastScore,
        googleplay: googleplayScore
      },
      recommendations,
      criticalIssues,
      improvements
    };
  };

  const fetchAndAnalyzeFeed = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    setValidation(null);
    setCompliance(null);
    setFeedData(null);
    
    setProgress({
      current: 0,
      total: 4,
      percentage: 0,
      status: 'running',
      currentRule: 'Fetching feed...'
    });

    try {
      let feedContent: string;
      
      if (useManualUrl && feedUrl) {
        // Step 1a: Fetch from manual URL
        setProgress(prev => ({ ...prev, current: 1, percentage: 25, currentRule: 'Fetching feed from URL...' }));
        const response = await axios.get(feedUrl, {
          headers: {
            'Accept': 'application/rss+xml, application/xml, text/xml, */*',
          },
          timeout: 10000,
        });
        feedContent = response.data;
      } else {
        // Step 1b: Fetch from Podcast Index
        setProgress(prev => ({ ...prev, current: 1, percentage: 25, currentRule: 'Fetching feed from Podcast Index...' }));
        
        // Fetch Homegrown Hits feed directly
        const response = await axios.get('https://feed.homegrownhits.xyz/feed.xml', {
          headers: {
            'Accept': 'application/rss+xml, application/xml, text/xml, */*',
          },
          timeout: 10000,
        });
        feedContent = response.data;
      }

      // Step 2: Parse the feed
      setProgress(prev => ({ ...prev, current: 2, percentage: 50, currentRule: 'Parsing feed...' }));
      const parseResult = await feedParserService.parseFeed(feedContent);
      
      if (!parseResult.success || !parseResult.feed) {
        throw new Error(parseResult.error || 'Failed to parse feed');
      }

      // Step 3: Validate the feed
      setProgress(prev => ({ ...prev, current: 3, percentage: 75, currentRule: 'Validating feed...' }));
      const validationResult = podcasting20Validator.validateFeed(parseResult.feed);

      // Step 4: Generate analysis and compliance report
      setProgress(prev => ({ ...prev, current: 4, percentage: 90, currentRule: 'Generating report...' }));
      
             const feedAnalysis: FeedAnalysis = {
         feedType: parseResult.feedType,
         namespaces: parseResult.namespaces,
         metadata: parseResult.metadata,
         statistics: {
           ...feedParserService.getFeedStatistics(parseResult.feed),
           hasFunding: 0, // TODO: Implement in FeedParserService
           hasLicense: 0, // TODO: Implement in FeedParserService
           hasValue: 0    // TODO: Implement in FeedParserService
         },
         validation: validationResult,
         structure: {
           ...feedParserService.validateFeedStructure(parseResult.feed),
           warnings: [], // TODO: Implement in FeedParserService
           info: []      // TODO: Implement in FeedParserService
         }
       };

      const complianceReport = generateComplianceReport(validationResult);

      setAnalysis(feedAnalysis);
      setValidation(validationResult);
      setCompliance(complianceReport);
      setFeedData(parseResult.feed);

      setProgress(prev => ({ ...prev, percentage: 100, status: 'completed' }));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch and analyze feed');
      setProgress(prev => ({ ...prev, status: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!useManualUrl) {
      fetchAndAnalyzeFeed();
    }
  }, [useManualUrl]);

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

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="rss-feed-checker">
      <div className="header">
        <div className="header-top">
          <h1>DuhLaurien's Hand-Hacked RSS Feed Checker</h1>
        </div>
        <p className="subtitle">Check episodes and tracks from Homegrown Hits</p>
        
        <div className="feed-mode-selector">
          <label className="mode-option">
            <input
              type="radio"
              name="feedMode"
              checked={!useManualUrl}
              onChange={() => setUseManualUrl(false)}
              disabled={loading}
            />
            <span>Homegrown Hits (Auto)</span>
          </label>
          <label className="mode-option">
            <input
              type="radio"
              name="feedMode"
              checked={useManualUrl}
              onChange={() => setUseManualUrl(true)}
              disabled={loading}
            />
            <span>Manual URL</span>
          </label>
        </div>
        
        <div className="feed-input">
          <input
            type="url"
            value={feedUrl}
            onChange={(e) => setFeedUrl(e.target.value)}
            placeholder={useManualUrl ? "Enter RSS feed URL" : "Homegrown Hits feed will load automatically"}
            className="feed-url-input"
            disabled={loading || !useManualUrl}
          />
          <button 
            onClick={fetchAndAnalyzeFeed} 
            disabled={loading || (useManualUrl && !feedUrl)} 
            className="fetch-button"
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Analyzing...
              </>
            ) : (
              'Check Feed'
            )}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      {loading && progress.status === 'running' && (
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress.percentage}%` }}
            ></div>
          </div>
          <p className="progress-text">{progress.currentRule}</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="error">
          <h3>❌ Error</h3>
          <p>{error}</p>
          <button onClick={fetchAndAnalyzeFeed} className="retry-button">
            Try Again
          </button>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && validation && compliance && (
        <div className="feed-results">



          {/* Episode List */}
          {analysis.feedType === 'rss' && feedData?.rss?.channel?.item && (
            <EpisodeList 
              episodes={Array.isArray(feedData.rss.channel.item) 
                ? feedData.rss.channel.item 
                : [feedData.rss.channel.item]} 
              feedType="rss" 
            />
          )}
          {analysis.feedType === 'atom' && feedData?.feed?.entry && (
            <EpisodeList 
              episodes={Array.isArray(feedData.feed.entry) 
                ? feedData.feed.entry 
                : [feedData.feed.entry]} 
              feedType="atom" 
            />
          )}



        </div>
      )}
    </div>
  );
};

export default RSSFeedChecker;
