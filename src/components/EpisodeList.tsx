import React, { useState } from 'react';
import { RSSItem, AtomEntry } from '../types/feed';
import './EpisodeList.css';

interface EpisodeDetailsProps {
  episode: RSSItem | AtomEntry;
  feedType: 'rss' | 'atom';
}

const EpisodeDetails: React.FC<EpisodeDetailsProps> = ({ episode, feedType }) => {
  const renderRSSDetails = (item: RSSItem) => {
    const formatFileSize = (bytes: string) => {
      const size = parseInt(bytes);
      if (size > 1024 * 1024) {
        return `${(size / (1024 * 1024)).toFixed(1)} MB`;
      }
      return `${(size / 1024).toFixed(1)} KB`;
    };

    return (
      <div className="simple-details">
        {/* Essential Info Only */}
        {item.enclosure && (
          <div className="detail-row">
            <span className="detail-label">Audio File:</span>
            <a href={item.enclosure.url} target="_blank" rel="noopener noreferrer" className="detail-link">
              Download ({formatFileSize(item.enclosure.length)})
            </a>
          </div>
        )}
        
        {item['itunes:duration'] && (
          <div className="detail-row">
            <span className="detail-label">Duration:</span>
            <span>{item['itunes:duration']}</span>
          </div>
        )}

        {(item['itunes:episode'] || item['itunes:season']) && (
          <div className="detail-row">
            <span className="detail-label">Episode:</span>
            <span>
              {item['itunes:season'] && `Season ${item['itunes:season']}`}
              {item['itunes:season'] && item['itunes:episode'] && ', '}
              {item['itunes:episode'] && `Episode ${item['itunes:episode']}`}
            </span>
          </div>
        )}

        {(item.author || item['itunes:author']) && (
          <div className="detail-row">
            <span className="detail-label">Author:</span>
            <span>{item.author || item['itunes:author']}</span>
          </div>
        )}

        {item.link && (
          <div className="detail-row">
            <span className="detail-label">Episode Page:</span>
            <a href={item.link} target="_blank" rel="noopener noreferrer" className="detail-link">
              View Online
            </a>
          </div>
        )}

        {/* Chapters - Show detailed info */}
        {item['podcast:chapters'] && (
          <div className="detail-row">
            <span className="detail-label">Chapters:</span>
            <span>
              📚 Available
              {item['podcast:chapters']?.$ && (
                <>
                  {' • '}
                  <a href={item['podcast:chapters'].$.url} target="_blank" rel="noopener noreferrer" className="detail-link">
                    {item['podcast:chapters'].$.type || 'View Chapters'}
                  </a>
                </>
              )}
            </span>
          </div>
        )}

        {/* Value Recipients */}
        {(item['podcast:value'] || item['podcast:valueRecipient']) && (
          <div className="detail-row">
            <span className="detail-label">Value 4 Value:</span>
            <span>
              ⚡ Enabled
              {item['podcast:valueRecipient'] && (
                <>
                  {' • '}
                  {Array.isArray(item['podcast:valueRecipient']) 
                    ? `${item['podcast:valueRecipient'].length} recipients`
                    : '1 recipient'
                  }
                </>
              )}
            </span>
          </div>
        )}

        {/* Show other extras if available */}
        {item['podcast:transcript'] && (
          <div className="detail-row">
            <span className="detail-label">Transcript:</span>
            <span>
              📄 Available
              {Array.isArray(item['podcast:transcript']) 
                ? ` (${item['podcast:transcript'].length} formats)`
                : ''
              }
            </span>
          </div>
        )}

        {/* Soundbites */}
        {item['podcast:soundbite'] && (
          <div className="detail-row">
            <span className="detail-label">Soundbites:</span>
            <span>
              🎵 {Array.isArray(item['podcast:soundbite']) 
                ? `${item['podcast:soundbite'].length} clips`
                : '1 clip'
              }
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderAtomDetails = (entry: AtomEntry) => (
    <div className="simple-details">
      <div className="detail-row">
        <span className="detail-label">Published:</span>
        <span>{new Date(entry.published || entry.updated).toLocaleDateString()}</span>
      </div>
      
      {entry.author?.name && (
        <div className="detail-row">
          <span className="detail-label">Author:</span>
          <span>{entry.author.name}</span>
        </div>
      )}

      {entry.link?.[0] && (
        <div className="detail-row">
          <span className="detail-label">Link:</span>
          <a href={entry.link[0].$.href} target="_blank" rel="noopener noreferrer" className="detail-link">
            View Online
          </a>
        </div>
      )}
    </div>
  );

  return (
    <div className="episode-details-simple">
      {feedType === 'rss' ? renderRSSDetails(episode as RSSItem) : renderAtomDetails(episode as AtomEntry)}
    </div>
  );
};

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
  checked: boolean;
  showDetails: boolean;
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
      checked: false,
      showDetails: false,
      rawEpisode: episode
    }));
  });

  const [selectAll, setSelectAll] = useState(false);

  const handleEpisodeToggle = (episodeId: string) => {
    setEpisodeData(prev => 
      prev.map(ep => 
        ep.id === episodeId ? { ...ep, checked: !ep.checked } : ep
      )
    );
  };

  const handleSelectAll = () => {
    const newSelectAll = !selectAll;
    setSelectAll(newSelectAll);
    setEpisodeData(prev => 
      prev.map(ep => ({ ...ep, checked: newSelectAll }))
    );
  };

  const toggleEpisodeDetails = (episodeId: string) => {
    setEpisodeData(prev => 
      prev.map(ep => 
        ep.id === episodeId ? { ...ep, showDetails: !ep.showDetails } : ep
      )
    );
  };

  const checkedCount = episodeData.filter(ep => ep.checked).length;

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

  const truncateText = (text: string, maxLength: number = 150): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="episode-list">
      <div className="episode-list-header">
        <h3>📻 Episodes ({episodes.length})</h3>
        <div className="episode-controls">
          <label className="select-all-checkbox">
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAll}
            />
            Select All ({checkedCount} selected)
          </label>
          {checkedCount > 0 && (
            <div className="selected-actions">
              <button className="action-button download">
                Download Selected ({checkedCount})
              </button>
              <button className="action-button export">
                Export List
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="episodes-container">
        {episodeData.map((episode) => (
          <div 
            key={episode.id} 
            className={`episode-item ${episode.checked ? 'checked' : ''}`}
          >
            <div className="episode-checkbox">
              <input
                type="checkbox"
                checked={episode.checked}
                onChange={() => handleEpisodeToggle(episode.id)}
                id={`episode-${episode.id}`}
              />
            </div>
            
            <div className="episode-content">
              <div className="episode-header">
                <h4 className="episode-title">{episode.title}</h4>
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
              
              <p className="episode-description">
                {truncateText(episode.description.replace(/<[^>]*>/g, ''))}
              </p>
              
              <div className="episode-actions">
                {episode.enclosureUrl && (
                  <a 
                    href={episode.enclosureUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="episode-link audio"
                  >
                    🎵 Audio File
                  </a>
                )}
                <button 
                  className="episode-link details"
                  onClick={() => toggleEpisodeDetails(episode.id)}
                >
                  📋 {episode.showDetails ? 'Hide Details' : 'Show Details'}
                </button>
              </div>

              {/* Episode Details */}
              {episode.showDetails && (
                <div className="episode-details">
                  <EpisodeDetails episode={episode.rawEpisode} feedType={feedType} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {checkedCount > 0 && (
        <div className="episode-summary">
          <p>
            <strong>{checkedCount}</strong> episode{checkedCount !== 1 ? 's' : ''} selected
          </p>
        </div>
      )}
    </div>
  );
};

export default EpisodeList;