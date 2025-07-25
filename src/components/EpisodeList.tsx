import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { RSSItem, AtomEntry } from '../types/feed';
import './EpisodeList.css';


interface EpisodeListProps {
  episodes: RSSItem[] | AtomEntry[];
  feedType: 'rss' | 'atom';
}

interface EpisodeData {
  id: string;
  title: string;
  description: string;
  pubDate?: string;
  duration?: string;
  enclosureUrl?: string;
  rawEpisode: RSSItem | AtomEntry;
}

const EpisodeList: React.FC<EpisodeListProps> = ({ episodes, feedType }) => {
  const [episodeData, setEpisodeData] = useState<EpisodeData[]>(() => {
    return episodes.map((episode, index) => ({
      id: feedType === 'rss' 
        ? (episode as RSSItem).guid?._ || `episode-${index}`
        : (episode as AtomEntry).id || `episode-${index}`,
      title: feedType === 'rss' 
        ? (episode as RSSItem).title 
        : (episode as AtomEntry).title,
      description: feedType === 'rss' 
        ? (episode as RSSItem).description 
        : (episode as AtomEntry).summary || (episode as AtomEntry).content || '',
      pubDate: feedType === 'rss' 
        ? (episode as RSSItem).pubDate 
        : (episode as AtomEntry).published || (episode as AtomEntry).updated,
      duration: feedType === 'rss' 
        ? (episode as RSSItem)['itunes:duration'] 
        : undefined,
      enclosureUrl: feedType === 'rss' 
        ? (episode as RSSItem).enclosure?.url 
        : undefined,
      rawEpisode: episode
    }));
  });


  const formatDuration = (duration?: string): string => {
    if (!duration) return '';
    
    // If already in HH:MM:SS or MM:SS format, return as is
    if (duration.includes(':')) {
      return duration;
    }
    
    // If it's in seconds, convert to MM:SS or HH:MM:SS
    const seconds = parseInt(duration);
    if (isNaN(seconds)) return duration;
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };


  return (
    <div className="episode-list">
      <div className="episode-list-header">
        <h3>📻 Episodes ({episodes.length})</h3>
      </div>

      <div className="episodes-container">
        {episodeData.map((episode) => (
          <div 
            key={episode.id} 
            className="episode-item"
          >
            
            <div className="episode-content">
              <div className="episode-header">
                <div className="episode-title-row">
                  <h4 className="episode-title">{episode.title}</h4>
                  <Link 
                    to={`/episode/${encodeURIComponent(episode.id)}`}
                    className="episode-link details inline"
                  >
                    📋 View Details
                  </Link>
                </div>
                <div className="episode-meta">
                  {episode.duration && (
                    <span className="episode-duration">
                      🕒 {formatDuration(episode.duration)}
                    </span>
                  )}
                  {episode.pubDate && (
                    <span className="episode-date">
                      📅 {formatDate(episode.pubDate)}
                    </span>
                  )}
                </div>
              </div>
              
              
              {episode.enclosureUrl && (
                <div className="episode-actions">
                  <a 
                    href={episode.enclosureUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="episode-link audio"
                  >
                    🎵 Audio File
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EpisodeList;