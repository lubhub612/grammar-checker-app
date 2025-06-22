import React, { useState, useEffect } from 'react';
import TextStats from './TextStats';
import PlagiarismChecker from './PlagiarismChecker';
import ToneAdjuster from './ToneAdjuster';
import VoiceInput from './VoiceInput';
import ReactMarkdown from 'react-markdown';
import { marked } from 'marked';
import TurndownService from 'turndown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FiCopy, FiCheck, FiBook, FiSave, FiUpload } from 'react-icons/fi';
import { format, formatDistanceToNow } from 'date-fns'; 
import './App.css';



// Initialize Turndown service
const turndownService = new TurndownService();

// Configure marked for safe rendering
marked.setOptions({
  breaks: true,
  sanitize: true
});

const GrammarChecker = () => {
  const [text, setText] = useState('');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [checkedText, setCheckedText] = useState('');
  const [rewrittenText, setRewrittenText] = useState('');
  const [filteredErrorTypes, setFilteredErrorTypes] = useState({
  grammar: true,
  spelling: true,
  punctuation: true,
  style: true
});
 const [userApprovedCorrections, setUserApprovedCorrections] = useState({});
 const [showAllCorrections, setShowAllCorrections] = useState(true);
 const [history, setHistory] = useState([]); // Stores past text states
 const [historyIndex, setHistoryIndex] = useState(-1); // Current position in history
 const [isRichText, setIsRichText] = useState(false);
 const [showPreview, setShowPreview] = useState(false);
 const [sessions, setSessions] = useState(() => {
    const saved = localStorage.getItem('writing-sessions');
    return saved ? JSON.parse(saved) : [];
  });
const [activeSession, setActiveSession] = useState(null);


  // Debounce function to limit API calls
  const debounce = (func, delay) => {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => func.apply(this, args), delay);
    };
  };

  const checkGrammar = async () => {
    if (!text.trim()) {
      setMatches([]);
      setCheckedText('');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('https://api.languagetool.org/v2/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          text: text,
          language: 'en-US',
        }),
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      setMatches(data.matches || []);

 
      setCheckedText(text);
    } catch (err) {
      setError('Failed to check grammar. Please try again later.');
      console.error('Grammar check error:', err);
    } finally {
      setLoading(false);
    }
  };

const getErrorType = (match) => {
  const ruleCategory = match.rule?.category?.id || '';
  
  if (ruleCategory.includes('spell')) {
    return 'spelling';
  }
  if (ruleCategory.includes('punct')) {
    return 'punctuation';
  }
  if (ruleCategory.includes('style') || 
      ruleCategory.includes('clarity') || 
      ruleCategory.includes('redundancy')) {
    return 'style';
  }
  return 'grammar'; // default
};

  const visibleMatches = matches.filter(match => {
  const type = getErrorType(match);
  return filteredErrorTypes[type];
});


const saveToHistory = (currentText) => {
  setHistory(prev => {
    const newHistory = prev.slice(0, historyIndex + 1);
    newHistory.push(currentText);
    return newHistory;
  });
  setHistoryIndex(prev => prev + 1);
};

const undo = () => {
  if (historyIndex <= 0) return; // No history left
  const prevText = history[historyIndex - 1];
  setText(prevText);
  setHistoryIndex(prev => prev - 1);
};

const redo = () => {
  if (historyIndex >= history.length - 1) return; // No future states
  const nextText = history[historyIndex + 1];
  setText(nextText);
  setHistoryIndex(prev => prev + 1);
};

  // Debounced version of checkGrammar
 // const debouncedCheckGrammar = debounce(checkGrammar, 1000);

  // Auto-check when text changes (with debounce)
 /* useEffect(() => {
    debouncedCheckGrammar();
    return () => debouncedCheckGrammar.cancel;
  }, [text, debouncedCheckGrammar]); */

  // Apply highlights to show errors
  const renderHighlightedText = () => {
    if (!checkedText || checkedText !== text) return null;

    let elements = [];
    let lastPos = 0;

    // Sort matches by offset to process in order
    //const sortedMatches = [...matches].sort((a, b) => a.offset - b.offset);
const sortedMatches = [...visibleMatches].sort((a, b) => a.offset - b.offset);

    sortedMatches.forEach((match, index) => {
      // Add text before the error
      if (match.offset > lastPos) {
        elements.push(
          <span key={`text-${index}-before`}>
            {checkedText.substring(lastPos, match.offset)}
          </span>
        );
      }

      const errorType = getErrorType(match);
    const errorClass = `error-${errorType}`;

      // Add the error text with highlighting
      elements.push(
        <span 
          key={`error-${index}`} 
          className={`error-highlight ${errorClass}`}
          // Inside your error span element
title={`${errorType.toUpperCase()} ERROR
Message: ${match.message}
Rule: ${match.rule?.description || 'Unknown rule'}
${match.replacements?.length ? `Suggestions: ${match.replacements.slice(0, 3).join(', ')}` : ''}`}
         // title={errorType.toUpperCase() + ': ' + match.message + (match.replacements?.length ? ` (Suggestions:  ${match.replacements.slice(0, 3).join(', ')})` : '')}
        >
          {checkedText.substring(match.offset, match.offset + match.length)}
        </span>
      );

      lastPos = match.offset + match.length;
    });

    // Add remaining text after last error
    if (lastPos < checkedText.length) {
      elements.push(
        <span key="text-after">
          {checkedText.substring(lastPos)}
        </span>
      );
    }

    return <div className="highlighted-text">{elements}</div>;
  };

  const rewriteText = () => {
  if (!matches.length || !text) return;
saveToHistory(text);
  let correctedText = text;
  let offsetAdjustment = 0;

  // Process matches in order of appearance
  const sortedMatches = [...visibleMatches].sort((a, b) => a.offset - b.offset);

  sortedMatches.forEach(match => {
    if (match.replacements && match.replacements.length > 0) {
      const bestReplacement = match.replacements[0].value;
      const start = match.offset + offsetAdjustment;
      const end = start + match.length;
      
      // Apply the correction
      correctedText = correctedText.substring(0, start) + 
                     bestReplacement + 
                     correctedText.substring(end);
      
      // Adjust offsets for subsequent corrections
      offsetAdjustment += bestReplacement.length - match.length;
    }
  });

  setRewrittenText(correctedText);
};

const getConfidenceLevel = (match) => {
  // Base confidence values for different rule types
  const CONFIDENCE_LEVELS = {
    grammar: 0.7,
    spelling: 0.9,
    punctuation: 0.8,
    style: 0.6,
    typography: 0.85
  };

  // Start with rule-based confidence or default
  let confidence = match.rule?.confidence || 
                 CONFIDENCE_LEVELS[getErrorType(match)] || 0.5;

  // Boost confidence for multiple replacement options
  if (match.replacements?.length > 1) {
    confidence += Math.min(0.15, match.replacements.length * 0.03);
  }

  // Adjust based on context length
  if (match.context?.text) {
    const contextLength = match.context.text.length;
    if (contextLength > 40) confidence += 0.1;
    if (contextLength < 15) confidence -= 0.1;
  }

  // Ensure confidence stays within bounds
  return Math.min(Math.max(confidence, 0.1), 0.95);
};

const ConfidenceIndicator = ({ level }) => {
  const percentage = Math.round(level * 100);
  let color;
  
  if (level > 0.8) color = '#2ecc71'; // Green
  else if (level > 0.6) color = '#f1c40f'; // Yellow
  else color = '#e74c3c'; // Red

  return (
    <div className="confidence-indicator">
      <div className="confidence-bar" style={{
        width: `${percentage}%`,
        backgroundColor: color
      }} />
      <span className="confidence-label">{percentage}%</span>
    </div>
  );
};

const toggleErrorType = (type) => {
  setFilteredErrorTypes(prev => ({
    ...prev,
    [type]: !prev[type]
  }));
};

const toggleApproval = (index) => {
  setUserApprovedCorrections(prev => ({
    ...prev,
    [index]: !prev[index]
  }));
};


const getFilteredMatches = () => {
  if (showAllCorrections) return visibleMatches;
  
  return visibleMatches.filter((_, index) => userApprovedCorrections[index]);
};


const applyCorrection = (matchIndex, replacement) => {
  saveToHistory(text);
  const match = visibleMatches[matchIndex];
  let newText = text;
  let offsetAdjustment = 0;

  // Apply this correction
  const start = match.offset + offsetAdjustment;
  const end = start + match.length;
  newText = newText.substring(0, start) + replacement + newText.substring(end);
  
  // Adjust offsets for other matches
  const lengthDiff = replacement.length - match.length;
  const updatedApprovals = {};
  
  Object.entries(userApprovedCorrections).forEach(([index, isApproved]) => {
    const numIndex = Number(index);
    if (numIndex > matchIndex) {
      updatedApprovals[numIndex - 1] = isApproved;
    } else if (numIndex < matchIndex) {
      updatedApprovals[numIndex] = isApproved;
    }
  });
  
  setText(newText);
  setUserApprovedCorrections(updatedApprovals);
  setMatches(prev => prev.filter((_, i) => i !== matchIndex));
};

const ErrorSuggestion = ({ match, index, onToggleApproval }) => {
  const confidence = getConfidenceLevel(match);
  const isApproved = userApprovedCorrections[index];
  
  return (
    <div className={`suggestion-item ${isApproved ? 'approved' : ''}`}>
      <div className="suggestion-header">
        <span className="error-type">{getErrorType(match)}</span>
        <ConfidenceIndicator level={confidence} />
        <button 
          onClick={() => onToggleApproval(index)}
          className={`approve-btn ${isApproved ? 'approved' : ''}`}
        >
          {isApproved ? '✓ Approved' : 'Approve'}
        </button>
      </div>
      <p className="error-message">{match.message}</p>
      {match.replacements?.length > 0 && (
        <div className="replacements">
          <strong>Suggestions:</strong>
          {match.replacements.slice(0, 3).map((rep, i) => (
            <button 
              key={i}
              className="replacement-option"
              onClick={() => applyCorrection(index, rep.value)}
            >
              {rep.value}
              {i === 0 && <span className="best-match-tag">Best</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const RichTextToolbar = ({ onFormat }) => {
  const formats = [
    { label: 'Bold', cmd: 'bold', icon: 'B' },
    { label: 'Italic', cmd: 'italic', icon: 'I' },
    { label: 'Bullet List', cmd: 'insertUnorderedList', icon: '•' },
    { label: 'Numbered List', cmd: 'insertOrderedList', icon: '1.' },
    { label: 'Heading', cmd: 'formatBlock', value: '<h2>', icon: 'H' },
    { label: 'Quote', cmd: 'formatBlock', value: '<blockquote>', icon: '❝' },
    { label: 'Code', cmd: 'formatBlock', value: '<pre>', icon: '</>' },
  ];

  return (
    <div className="rich-text-toolbar">
      {formats.map((format) => (
        <button
          key={format.label}
          title={format.label}
          onClick={() => onFormat(format.cmd, format.value)}
          className="format-btn"
        >
          {format.icon}
        </button>
      ))}
      <span className="divider">|</span>
      <button 
        onClick={() => onFormat('removeFormat')} 
        title="Clear Formatting"
        className="format-btn"
      >
        🗑️
      </button>
    </div>
  );
};

const MarkdownPreview = ({ content }) => {
  return (
    <div className="markdown-preview">
      <ReactMarkdown
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                style={atomDark}
                language={match[1]}
                PreTag="div"
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

const handleFormat = (cmd, value = null) => {
    document.execCommand(cmd, false, value);
    document.getElementById('editor').focus();
  };

  // Toggle between plain text and rich text
  const toggleEditorMode = () => {
    setIsRichText(!isRichText);
    if (!isRichText) {
      // Convert to HTML when switching to rich text
      const html = marked.parse(text);
      setText(html);
    } else {
      // Convert to Markdown when switching to plain text
      const md = turndownService.turndown(text);
      setText(md);
    }
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

const getReadingLevelColor = (level) => {
    if (level < 6) return '#2ecc71';  // Green - easy
    if (level < 9) return '#f1c40f';  // Yellow - moderate
    if (level < 12) return '#e67e22'; // Orange - challenging
    return '#e74c3c';                 // Red - difficult
  };
  const calculateStats = (text, readingSpeed) => {
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
  };

  // Add debouncing to prevent too frequent saves
useEffect(() => {
  if (!text.trim()) return;

  const timer = setTimeout(() => {
    saveSession();
  }, 30000);

  return () => clearTimeout(timer);
}, [text]);

// Add this to your saveSession function to prevent duplicates
const saveSession = () => {
  const trimmedText = text.trim();
  if (!trimmedText) return;

  setSessions(prev => {
    // Don't save if identical to last session
    if (prev.length > 0 && prev[0].text === trimmedText) {
      return prev;
    }

    const newSession = {
      id: Date.now(),
      text: trimmedText,
      createdAt: new Date().toISOString(),
      stats: calculateStats(trimmedText, 200)
    };

    const updated = [newSession, ...prev].slice(0, 50);
    localStorage.setItem('writing-sessions', JSON.stringify(updated));
    return updated;
  });
};

const loadSession = (session) => {
    setText(session.text);
    setActiveSession(session.id);
  };

  const handleToneAdjust = (adjustedText) => {
    setText(adjustedText);
  };

  return (
    <div className="app-container">
      <h1>Grammar Checker</h1>
      <div className="checker-container">
        <div className="editor-container">
      <div className="editor-controls">
        <button onClick={toggleEditorMode}>
          {isRichText ? 'Switch to Markdown' : 'Switch to Rich Text'}
        </button>
        
        <button onClick={() => setShowPreview(!showPreview)}>
          {showPreview ? 'Hide Preview' : 'Show Preview'}
        </button>
      </div>

      {isRichText && <RichTextToolbar onFormat={handleFormat} />}

      <div className="editor-preview-container">
        {showPreview ? (
          <MarkdownPreview content={text} />
        ) : isRichText ? (
          <div
            id="editor"
            contentEditable
            dangerouslySetInnerHTML={{ __html: text }}
            onInput={(e) => setText(e.target.innerHTML)}
            className="rich-text-editor"
          />
        ) : (
          <>
          <div className="text-input-container">
            <VoiceInput onTextChange={setText} />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste your text here to check grammar..."
            rows={10}
          />
          <div className="controls">
            <button 
              onClick={checkGrammar} 
              disabled={loading || !text.trim()}
            >
              {loading ? 'Checking...' : 'Check Grammar'}
            </button>
            {text && (
              <button 
                className="clear-btn"
                onClick={() => setText('')}
                disabled={loading}
              >
                Clear
              </button>
            )}
          </div>
        </div>
          </>
        )}
      </div>
      <div className="session-controls">
          <button onClick={saveSession} className="save-button">
            <FiSave /> Save Session
          </button>
           <TextStats text={text} />
           <PlagiarismChecker text={text} />
           <ToneAdjuster text={text} onToneAdjust={handleToneAdjust} />
<SessionHistory 
        sessions={sessions}
        activeSession={activeSession}
        onLoad={loadSession}
        onClear={() => {
          setSessions([]);
          localStorage.removeItem('writing-sessions');
        }}
      />
        </div>
    </div>
    
        
        {/* <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your Markdown here..."
            className="markdown-editor"
          /> 
        <div className="text-input-container">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type or paste your text here to check grammar..."
            rows={10}
          />
          <div className="controls">
            <button 
              onClick={checkGrammar} 
              disabled={loading || !text.trim()}
            >
              {loading ? 'Checking...' : 'Check Grammar'}
            </button>
            {text && (
              <button 
                className="clear-btn"
                onClick={() => setText('')}
                disabled={loading}
              >
                Clear
              </button>
            )}
          </div>
        </div> */}
        

        <div className="results-container">
          <h2>Results</h2>
          {loading && <div className="loading">Checking grammar...</div>}
          {error && <div className="error">{error}</div>}
          <div className="error-legend">
  <h4>Error Types:</h4>
  <div className="legend-items">
    <div className="legend-item">
      <span className="legend-color grammar"></span>
      <span>Grammar</span>
    </div>
    <div className="legend-item">
      <span className="legend-color spelling"></span>
      <span>Spelling</span>
    </div>
    <div className="legend-item">
      <span className="legend-color punctuation"></span>
      <span>Punctuation</span>
    </div>
    <div className="legend-item">
      <span className="legend-color style"></span>
      <span>Style</span>
    </div>
  </div>
</div>

<div className="undo-redo-controls">
  <button 
    onClick={undo} 
    disabled={historyIndex <= 0}
  >
    ↺ Undo
  </button>
  <button 
    onClick={redo} 
    disabled={historyIndex >= history.length - 1}
  >
    ↻ Redo
  </button>
</div>
          {visibleMatches.length > 0 ? (
            <>
              {renderHighlightedText()}
              <div className="issues-found">
                Found {visibleMatches.length} issue{visibleMatches.length !== 1 ? 's' : ''}
              </div>
              <div className="error-filters">
  <h4>Filter Errors:</h4>
  {Object.keys(filteredErrorTypes).map(type => (
    <label key={type}>
      <input
        type="checkbox"
        checked={filteredErrorTypes[type]}
        onChange={() => toggleErrorType(type)}
      />
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </label>
  ))}
</div>
              <div className="suggestions-list">
                <h3>Suggestions:</h3>
                {visibleMatches.map((match, index) => (
                  <div key={index} className="suggestion-item">
                    <p>
                      <strong>Error:</strong> {match.message}
                    </p>
                    {match.replacements?.length > 0 && (
                      <p>
                        <strong>Possible corrections:</strong> {match.replacements.slice(0, 5).join(', ')}
                      </p>
                    )}
                    <p className="context">
                      Context: ...{match.context.text.substring(
                        Math.max(0, match.context.offset - 10),
                        match.context.offset + match.context.length + 10
                      )}...
                    </p>
                  </div>
                ))}
              </div>
              <button 
    onClick={rewriteText}
    className="rewrite-btn"
    disabled={loading}
  >
    Auto-Rewrite Corrected Text
  </button>
  

  <div className="suggestions-list">
  <div className="controls">
    <label>
      <input
        type="checkbox"
        checked={showAllCorrections}
        onChange={() => setShowAllCorrections(!showAllCorrections)}
      />
      Show all suggestions
    </label>
  </div>

  {getFilteredMatches().map((match, index) => (
      <ErrorSuggestion
        key={index}
        match={match}
        index={index}
        onToggleApproval={toggleApproval}
      />
    ))}
</div>

            </>
          ) : (
            !loading &&
            text &&
            checkedText === text && (
              <div className="no-issues">No grammar issues found! 🎉</div>
            )
          )}
          {rewrittenText && (
  <div className="rewritten-section">
    <h3>Corrected Version:</h3>
    <div className="rewritten-text">
      {rewrittenText}
    </div>
    <button 
      onClick={() => {
        setText(rewrittenText);
        setRewrittenText('');
      }}
      className="apply-rewrite"
    >
      Use This Version
    </button>
    <button
      onClick={() => setRewrittenText('')}
      className="discard-rewrite"
    >
      Discard
    </button>
  </div>
)}
        </div>
        
      </div>
    </div>
  );
};

const SessionHistory = ({ sessions, activeSession, onLoad, onClear }) => {
  const [showHistory, setShowHistory] = useState(false);
  const [exportData, setExportData] = useState('');

  // Export sessions to JSON
  const handleExport = () => {
    setExportData(JSON.stringify(sessions, null, 2));
  };

  // Import sessions from JSON
  const handleImport = () => {
    try {
      const imported = JSON.parse(exportData);
      if (Array.isArray(imported)) {
        onClear(); // Clear existing sessions
        imported.forEach(session => {
          onLoad(session); // Load each imported session
        });
        setExportData('');
      }
    } catch (err) {
      alert('Invalid session data');
    }
  };

  return (
    <div className={`session-history ${showHistory ? 'visible' : ''}`}>
      <button 
        onClick={() => setShowHistory(!showHistory)}
        className="history-toggle"
      >
        <FiBook /> {showHistory ? 'Hide History' : 'Show History'}
      </button>

      {showHistory && (
        <div className="history-content">
          <h3>Session History</h3>
          
          <div className="import-export">
            <textarea
              value={exportData}
              onChange={(e) => setExportData(e.target.value)}
              placeholder="Paste session data to import..."
              rows={4}
            />
            <div className="import-export-buttons">
              <button onClick={handleExport} disabled={sessions.length === 0}>
                <FiSave /> Export All
              </button>
              <button onClick={handleImport} disabled={!exportData.trim()}>
                <FiUpload /> Import
              </button>
            </div>
          </div>

          <div className="session-list">
            {sessions.length === 0 ? (
              <p className="empty-history">No saved sessions yet</p>
            ) : (
              sessions.map(session => (
                <div 
                  key={session.id}
                  className={`session-item ${activeSession === session.id ? 'active' : ''}`}
                  onClick={() => onLoad(session)}
                >
                  <div className="session-preview">
                    {session.text.substring(0, 100)}{session.text.length > 100 ? '...' : ''}
                  </div>
                  <div className="session-meta">
                    <span className="session-date">
                      {format(new Date(session.createdAt), 'MMM d, yyyy - h:mm a')}
                    </span>
                    <span className="session-stats">
                      {session.stats.wordCount} words • {session.stats.readingTimeMinutes} min read
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {sessions.length > 0 && (
            <button onClick={onClear} className="clear-history">
              Clear All History
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default GrammarChecker;