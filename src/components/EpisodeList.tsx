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
  const [episodeData] = useState<EpisodeData[]>(() => {
    return episodes.map((episode, index) => {
      const title = feedType === 'rss' 
        ? (episode as RSSItem).title 
        : (episode as AtomEntry).title;
      
      // Extract episode number from title like "Homegrown Hits - Episode 95"
      const episodeNumberMatch = title.match(/Episode\s+(\d+)/i);
      const episodeNumber = episodeNumberMatch ? episodeNumberMatch[1] : (index + 1).toString();
      
      // Create a unique ID that includes both episode number and index to prevent duplicates
      const uniqueId = feedType === 'rss' 
        ? (episode as RSSItem).guid?._ || `episode-${episodeNumber}-${index}`
        : (episode as AtomEntry).id || `episode-${episodeNumber}-${index}`;
      
      return {
        id: uniqueId,
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