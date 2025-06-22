import { useState, useMemo, useRef } from 'react';
import { Tooltip } from 'react-tooltip';
import { FiCopy, FiCheck } from 'react-icons/fi'; 
import 'react-tooltip/dist/react-tooltip.css';

const TextStats = ({ text }) => {
  const [readingSpeed, setReadingSpeed] = useState(200);
  const [showExplanations, setShowExplanations] = useState(false);
  const [copied, setCopied] = useState(false);
  const statsRef = useRef(null);

  const getReadingLevelColor = (level) => {
    if (level < 6) return '#2ecc71';  // Green - easy
    if (level < 9) return '#f1c40f';  // Yellow - moderate
    if (level < 12) return '#e67e22'; // Orange - challenging
    return '#e74c3c';                 // Red - difficult
  };


  const stats = useMemo(() => {
    ///calculateStats(text, readingSpeed)
    if (!text) return null;
    
    const wordCount = text.trim() === '' ? 0 : 
      text.split(/\s+/).filter(word => word.length > 0).length;
    const charCount = text.length;
    const charCountNoSpaces = text.replace(/\s+/g, '').length;
    const readingTimeMinutes = Math.ceil(wordCount / readingSpeed);
    const readingLevel = calculateReadingLevel(text);
    
    // Get color for reading level
    const readingLevelColor = getReadingLevelColor(readingLevel);

    const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
const paragraphCount = text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
const avgWordLength = charCountNoSpaces / wordCount;

    return {
      wordCount,
      charCount,
      charCountNoSpaces,
      readingTimeMinutes,
      readingLevel,
      readingLevelColor,
      sentenceCount,
      paragraphCount,
      avgWordLength
    }; 
  }, [text, readingSpeed]);

  const copyToClipboard = () => {
    if (!statsRef.current) return;
    
    const statsText = Array.from(statsRef.current.querySelectorAll('.stat-item'))
      .map(item => {
        const value = item.querySelector('.stat-value').textContent;
        const label = item.querySelector('.stat-label').textContent;
        return `${value} ${label}`;
      })
      .join('\n');
    
    navigator.clipboard.writeText(statsText)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => console.error('Failed to copy:', err));
  };

  const metricExplanations = {
    wordCount: "Total number of words in your text",
    charCount: "Total characters including spaces",
    charCountNoSpaces: "Total characters excluding spaces",
    readingTimeMinutes: `Estimated reading time at ${readingSpeed} words per minute`,
    readingLevel: "Flesch-Kincaid grade level (higher numbers mean more complex text)",
    sentenceCount: "Total number of sentences in your text",
    paragraphCount: "Total number of paragraphs in your text",
    avgWordLength: "Average length of words in your text"
  };

  if (!stats) return null;

  return (
    <div className="text-stats-container">
      <div className="stats-controls">
        <div className="speed-control">
          <label>Reading speed:</label>
          <select 
            value={readingSpeed} 
            onChange={(e) => setReadingSpeed(Number(e.target.value))}
          >
            <option value={150}>Slow (150 wpm)</option>
            <option value={200}>Average (200 wpm)</option>
            <option value={250}>Fast (250 wpm)</option>
          </select>
        </div>
        <button 
          onClick={() => setShowExplanations(!showExplanations)}
          className="toggle-explanations"
        >
          {showExplanations ? 'Hide Help' : 'Show Help'}
        </button>
        <button 
            onClick={copyToClipboard}
            className="copy-button"
            data-tooltip-id="copy-tooltip"
          >
            {copied ? <FiCheck /> : <FiCopy />}
            <span>{copied ? 'Copied!' : 'Copy Stats'}</span>
          </button>
          <Tooltip id="copy-tooltip" place="top" effect="solid">
            {copied ? 'Statistics copied!' : 'Copy all statistics to clipboard'}
          </Tooltip>
      </div>

      <div className="text-stats" ref={statsRef}>
        <StatItem 
          value={stats.wordCount}
          label="words"
          explanation={metricExplanations.wordCount}
          showExplanations={showExplanations}
        />
        <StatItem 
          value={stats.charCount}
          label="characters"
          explanation={metricExplanations.charCount}
          showExplanations={showExplanations}
        />
        <StatItem 
          value={stats.charCountNoSpaces}
          label="no spaces"
          explanation={metricExplanations.charCountNoSpaces}
          showExplanations={showExplanations}
        />
        <StatItem 
          value={`${stats.readingTimeMinutes} min${stats.readingTimeMinutes !== 1 ? 's' : ''}`}
          label="read time"
          explanation={metricExplanations.readingTimeMinutes}
          showExplanations={showExplanations}
        />
        <StatItem 
          value={stats.readingLevel}
          label="grade level"
          explanation={metricExplanations.readingLevel}
          showExplanations={showExplanations}
          valueColor={stats.readingLevelColor}
        />
        <StatItem
          value={stats.sentenceCount}
          label={metricExplanations.sentenceCount}
          explanation="Total number of sentences in your text"
          showExplanations={showExplanations}
          
        />
        <StatItem
          value={stats.paragraphCount}
          label={metricExplanations.paragraphCount}
          explanation="Total number of paragraphs in your text"
          showExplanations={showExplanations}
          
        />
        <StatItem
          value={stats.avgWordLength.toFixed(2)}
          label={metricExplanations.avgWordLength}
          explanation="Average length of words in your text"
          showExplanations={showExplanations}
            
        />



      </div>

      {showExplanations && (
        <div className="reading-level-info">
          <div className="level-indicator">
            <span style={{ backgroundColor: '#2ecc71' }}>Elementary (1-5)</span>
            <span style={{ backgroundColor: '#f1c40f' }}>Middle School (6-8)</span>
            <span style={{ backgroundColor: '#e67e22' }}>High School (9-11)</span>
            <span style={{ backgroundColor: '#e74c3c' }}>College+ (12+)</span>
          </div>
          <p>
            The Flesch-Kincaid grade level estimates the U.S. school grade needed
            to understand the text. Most newspapers aim for 8-10, while academic
            papers often score 12+.
          </p>
        </div>
      )}
    </div>
  );
};

const StatItem = ({ value, label, explanation, showExplanations, valueColor }) => {
  return (
    <div 
      className="stat-item"
      data-tooltip-id={`stat-${label}`}
      data-tooltip-content={explanation}
    >
      <span 
        className="stat-value"
        style={valueColor ? { color: valueColor } : {}}
      >
        {value}
      </span>
      <span className="stat-label">{label}</span>
      
      {showExplanations && (
        <Tooltip id={`stat-${label}`} place="top" effect="solid" />
      )}
    </div>
  );
};

const calculateReadingLevel = (text) => {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  
  if (sentences.length === 0 || words.length === 0) return 0;
  
  const syllables = words.reduce((count, word) => {
    // Improved syllable counting for common suffixes
    word = word.toLowerCase()
      .replace(/'s$/, '')
      .replace(/'ll$/, '')
      .replace(/'re$/, '');
    return count + countSyllables(word);
  }, 0);
  
  const wordsPerSentence = words.length / sentences.length;
  const syllablesPerWord = syllables / words.length;
  
  const level = 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;
  return Math.max(1, Math.min(16, level.toFixed(1))); // Clamp between 1-16
};

const countSyllables = (word) => {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  
  // Handle common exceptions
  const exceptions = {
    'the': 1, 'and': 1, 'every': 2, 'seven': 2
  };
  if (exceptions[word]) return exceptions[word];
  
  // Count vowel groups
  word = word.replace(/[^aeiouy]+/g, ' ');
  return word.trim().split(/\s+/).length || 1;
};

export default TextStats;