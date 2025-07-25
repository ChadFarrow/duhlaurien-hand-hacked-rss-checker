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
          <Link
            key={episode.id}
            to={`/episode/${encodeURIComponent(episode.id)}`}
            className="episode-item-link"
          >
            <div className="episode-item">
              <div className="episode-header-single-line">
                <h4 className="episode-title">{episode.title}</h4>
                {episode.pubDate && (
                  <span className="meta-badge date">
                    📅 {formatDate(episode.pubDate)}
                  </span>
                )}
                <span className="action-btn secondary compact">
                  Details
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default EpisodeList;