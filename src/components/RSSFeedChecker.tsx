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
        <h1 className="title">DuhLaurien's Hand-Hacked RSS Feed Checker</h1>
        <p className="subtitle">Check episodes and tracks from Homegrown Hits</p>
      </div>

      <div className="controls">
        <div className="radio-group">
          <div className="radio-item">
            <input
              type="radio"
              id="auto"
              name="feed-type"
              value="auto"
              checked={!useManualUrl}
              onChange={() => setUseManualUrl(false)}
              disabled={loading}
            />
            <label htmlFor="auto">🎵 Homegrown Hits (Auto)</label>
          </div>
          <div className="radio-item">
            <input
              type="radio"
              id="manual"
              name="feed-type"
              value="manual"
              checked={useManualUrl}
              onChange={() => setUseManualUrl(true)}
              disabled={loading}
            />
            <label htmlFor="manual">🔗 Manual URL</label>
          </div>
        </div>

        <div className="input-group">
          <input
            type="text"
            value={feedUrl}
            onChange={(e) => setFeedUrl(e.target.value)}
            placeholder={useManualUrl ? "Enter RSS feed URL..." : "Homegrown Hits feed will load automatically"}
            className="feed-input"
            id="feedUrl"
            disabled={loading || !useManualUrl}
          />
          <button 
            onClick={fetchAndAnalyzeFeed} 
            disabled={loading || (useManualUrl && !feedUrl)} 
            className="check-btn"
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                🔄 Checking...
              </>
            ) : (
              '✨ Check Feed'
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
        <div className="episodes">
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

  // Get show artwork from RSS feed standard image element, fallback to latest episode image
  const showArtwork = feedData?.rss?.channel?.image?.url || 
                     feedData?.rss?.channel?.item?.[0]?.['itunes:image']?.$?.href ||
                     feedData?.rss?.channel?.item?.[0]?.enclosure?.url?.replace(/\.(mp3|m4a|wav|ogg)$/i, '.jpg') ||
                     'https://feed.homegrownhits.xyz/assets/images/episode-54.JPG';


  return (
    <>
      {/* Show artwork background - from RSS feed or fallback */}
      <div 
        className="show-artwork-background"
        style={{ backgroundImage: `url(${showArtwork})` }}
      />
      
      <div className="container">
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
