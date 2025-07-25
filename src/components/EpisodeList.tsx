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
    return episodes.map((episode, index) => {
      const title = feedType === 'rss' 
        ? (episode as RSSItem).title 
        : (episode as AtomEntry).title;
      
      // Extract episode number from title like "Homegrown Hits - Episode 95"
      const episodeNumberMatch = title.match(/Episode\s+(\d+)/i);
      const episodeNumber = episodeNumberMatch ? episodeNumberMatch[1] : (index + 1).toString();
      
      return {
        id: feedType === 'rss' 
          ? (episode as RSSItem).guid?._ || `episode-${episodeNumber}`
          : (episode as AtomEntry).id || `episode-${episodeNumber}`,
        title: title,
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
      };
    });
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
    <>
      <div className="episodes-header">
        <div className="episodes-icon">📻</div>
        <span>Episodes ({episodes.length})</span>
      </div>

      {episodeData.map((episode) => (
        <Link
          key={episode.id}
          to={`/episode/${encodeURIComponent(episode.id)}`}
          className="episode-link"
        >
          <div className="episode-item">
            <div className="episode-title">{episode.title}</div>
            <div className="episode-meta">
              {episode.pubDate && (
                <div className="episode-date">
                  📅 {formatDate(episode.pubDate)}
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </>
  );
};

export default EpisodeList;