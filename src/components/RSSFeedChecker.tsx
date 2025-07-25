import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import axios from 'axios';
import { feedParserService } from '../services/FeedParserService';
// import { podcastIndexService } from '../services/PodcastIndexService';
import { 
  ValidationProgress 
} from '../types/validation';
import { RSSFeed } from '../types/feed';
import EpisodeList from './EpisodeList';
import EpisodeDetailPage from './EpisodeDetailPage';
import './RSSFeedChecker.css';

const RSSFeedChecker: React.FC = () => {
  const [feedUrl, setFeedUrl] = useState('');
  const [useManualUrl, setUseManualUrl] = useState(false);
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


  const fetchAndAnalyzeFeed = async () => {
    setLoading(true);
    setError(null);
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

      // Step 3: Set feed data
      setProgress(prev => ({ ...prev, current: 3, percentage: 90, currentRule: 'Processing episodes...' }));
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


  // Component to render the main feed page
  const MainFeedPage = () => {
    // Get show artwork URL
    const showArtwork = feedData?.rss?.channel?.image?.url || 
                       feedData?.rss?.channel?.['itunes:image']?.$?.href;

    return (
    <>
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


      {/* Episode List */}
      {feedData && (
        <div className="feed-results">
          {feedData?.rss?.channel?.item && (
            <EpisodeList 
              episodes={Array.isArray(feedData.rss.channel.item) 
                ? feedData.rss.channel.item 
                : [feedData.rss.channel.item]} 
              feedType="rss" 
            />
          )}
          {feedData?.feed?.entry && (
            <EpisodeList 
              episodes={Array.isArray(feedData.feed.entry) 
                ? feedData.feed.entry 
                : [feedData.feed.entry]} 
              feedType="atom" 
            />
          )}
        </div>
      )}
      
    </>
    );
  };

  // Get show artwork URL
  const showArtwork = feedData?.rss?.channel?.image?.url || 
                     (feedData?.rss?.channel?.['itunes:image'] as any)?.['@_href'];


  return (
    <>
      {/* Show artwork background - outside main container */}
      {showArtwork && (
        <div 
          className="show-artwork-background"
          style={{ backgroundImage: `url(${showArtwork})` }}
        />
      )}
      
      <div className="rss-feed-checker">
        <Routes>
          <Route path="/" element={<MainFeedPage />} />
          <Route 
            path="/episode/:episodeId" 
            element={
              feedData ? (
                <>
                  {feedData?.rss?.channel?.item ? (
                    <EpisodeDetailPage 
                      episodes={Array.isArray(feedData.rss.channel.item) 
                        ? feedData.rss.channel.item 
                        : [feedData.rss.channel.item]} 
                      feedType="rss" 
                    />
                  ) : feedData?.feed?.entry ? (
                    <EpisodeDetailPage 
                      episodes={Array.isArray(feedData.feed.entry) 
                        ? feedData.feed.entry 
                        : [feedData.feed.entry]} 
                      feedType="atom" 
                    />
                  ) : (
                    <div>Episode data not available</div>
                  )}
                </>
              ) : (
                <div>Feed data not loaded</div>
              )
            } 
          />
        </Routes>
      </div>
    </>
  );
};

export default RSSFeedChecker;
