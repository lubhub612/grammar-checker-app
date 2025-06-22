import { useState } from 'react';
import { FiSearch, FiAlertTriangle } from 'react-icons/fi';

const PlagiarismChecker = ({ text }) => {
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkPlagiarism = async () => {
    if (!text.trim()) {
      setError('Please enter some text to check');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call - replace with actual plagiarism API integration
      const plagiarismResults = await simulatePlagiarismCheck(text);
      setResults(plagiarismResults);
    } catch (err) {
      setError('Failed to check plagiarism. Please try again.');
      console.error('Plagiarism check error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="plagiarism-checker">
      <h3>
        <FiAlertTriangle /> Plagiarism Check
      </h3>
      
      <button 
        onClick={checkPlagiarism}
        disabled={isLoading || !text.trim()}
        className="check-button"
      >
        {isLoading ? (
          <>Checking...</>
        ) : (
          <>
            <FiSearch /> Check for Plagiarism
          </>
        )}
      </button>

      {error && <div className="error-message">{error}</div>}

      {results && (
        <div className="results-container">
          <div className="similarity-score">
            <div className="score-circle" style={{ 
              '--score-color': getScoreColor(results.similarityScore)
            }}>
              {results.similarityScore}%
            </div>
            <span>Similarity Score</span>
          </div>

          {results.matches.length > 0 && (
            <div className="matches-list">
              <h4>Potential Matches:</h4>
              {results.matches.slice(0, 5).map((match, index) => (
                <div key={index} className="match-item">
                  <div className="match-header">
                    <span className="match-percent">{match.similarity}% similar</span>
                    <a 
                      href={match.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="match-url"
                    >
                      {new URL(match.url).hostname}
                    </a>
                  </div>
                  <div className="match-content">
                    {match.matchedText}
                  </div>
                </div>
              ))}
            </div>
          )}

          {results.matches.length === 0 && (
            <div className="no-matches">
              No significant matches found. Your text appears to be original.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper function to simulate API response
const simulatePlagiarismCheck = async (text) => {
  // In a real implementation, you would call an actual plagiarism API here
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Simulated response
  const score = Math.min(100, Math.floor(text.length / 10));
  const hasMatches = score > 20 && text.length > 50;
  
  return {
    similarityScore: score,
    matches: hasMatches ? [
      {
        similarity: Math.min(100, score + 5),
        url: 'https://example.com/source1',
        matchedText: text.substring(0, 100) + '...'
      },
      {
        similarity: Math.min(100, score - 5),
        url: 'https://example.org/source2',
        matchedText: text.substring(50, 150) + '...'
      }
    ] : []
  };
};

const getScoreColor = (score) => {
  if (score < 20) return '#2ecc71'; // Green - low similarity
  if (score < 50) return '#f1c40f'; // Yellow - moderate
  return '#e74c3c'; // Red - high similarity
};

export default PlagiarismChecker;