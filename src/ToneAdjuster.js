import { useState } from 'react';
import { FiEdit2 } from 'react-icons/fi';

const ToneAdjuster = ({ text, onToneAdjust }) => {
  const [tone, setTone] = useState('neutral');
  const [isLoading, setIsLoading] = useState(false);
  const [adjustedText, setAdjustedText] = useState('');

  const tones = [
    { id: 'formal', label: 'Formal', description: 'Professional, business-appropriate language' },
    { id: 'casual', label: 'Casual', description: 'Conversational, friendly tone' },
    { id: 'concise', label: 'Concise', description: 'Shortened while preserving meaning' },
    { id: 'neutral', label: 'Neutral', description: 'Reset to original text' }
  ];

  const adjustTone = async () => {
    if (!text.trim()) return;
    
    setIsLoading(true);
    setAdjustedText('');

    try {
      // Simulate API call - replace with actual implementation
      const result = await simulateToneAdjustment(text, tone);
      setAdjustedText(result);
      onToneAdjust(result);
    } catch (err) {
      console.error("Tone adjustment failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="tone-adjuster">
      <h3>
        <FiEdit2 /> Adjust Tone
      </h3>

      <div className="tone-options">
        {tones.map((option) => (
          <label key={option.id} className="tone-option">
            <input
              type="radio"
              name="tone"
              checked={tone === option.id}
              onChange={() => setTone(option.id)}
            />
            <div className="tone-card">
              <span className="tone-label">{option.label}</span>
              <span className="tone-description">{option.description}</span>
            </div>
          </label>
        ))}
      </div>

      <button
        onClick={adjustTone}
        disabled={isLoading || !text.trim() || tone === 'neutral'}
        className="adjust-button"
      >
        {isLoading ? 'Adjusting...' : 'Apply Tone'}
      </button>

      {adjustedText && (
        <div className="tone-result">
          <h4>Adjusted Text:</h4>
          <div className="adjusted-text">
            {adjustedText}
          </div>
          <button
            onClick={() => {
              onToneAdjust(adjustedText);
              setAdjustedText('');
            }}
            className="use-text-button"
          >
            Use This Version
          </button>
        </div>
      )}
    </div>
  );
};

// Simulated tone adjustment - replace with real implementation
const simulateToneAdjustment = (text, tone) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (tone === 'neutral') return resolve(text);
      
      const sentences = text.split(/(?<=[.!?])\s+/);
      
      const adjusted = sentences.map(sentence => {
        if (tone === 'formal') {
          return formalize(sentence);
        } else if (tone === 'casual') {
          return casualize(sentence);
        } else if (tone === 'concise') {
          return concisen(sentence);
        }
        return sentence;
      }).join(' ');

      resolve(adjusted);
    }, 1000);
  });
};

// Example transformation functions
const formalize = (text) => {
  const replacements = {
    "don't": "do not",
    "can't": "cannot",
    "won't": "will not",
    "it's": "it is",
    "I'm": "I am",
    "you're": "you are",
    "they're": "they are",
    "gonna": "going to",
    "wanna": "want to",
    "kinda": "kind of",
    "sorta": "sort of",
    "got": "have",
    "like,": "such as",
    "awesome": "impressive",
    "cool": "appropriate",
    "hey": "dear",
    "hi": "hello"
  };

  return Object.entries(replacements).reduce((result, [from, to]) => {
    return result.replace(new RegExp(`\\b${from}\\b`, 'gi'), to);
  }, text);
};

const casualize = (text) => {
  const replacements = {
    "do not": "don't",
    "cannot": "can't",
    "will not": "won't",
    "it is": "it's",
    "I am": "I'm",
    "you are": "you're",
    "they are": "they're",
    "going to": "gonna",
    "want to": "wanna",
    "kind of": "kinda",
    "sort of": "sorta",
    "have": "got",
    "such as": "like,",
    "impressive": "awesome",
    "appropriate": "cool",
    "dear": "hey",
    "hello": "hi"
  };

  return Object.entries(replacements).reduce((result, [from, to]) => {
    return result.replace(new RegExp(`\\b${from}\\b`, 'gi'), to);
  }, text);
};

const concisen = (text) => {
  const verbosePhrases = {
    "due to the fact that": "because",
    "in order to": "to",
    "at this point in time": "now",
    "in the event that": "if",
    "with regard to": "about",
    "on a daily basis": "daily",
    "take into consideration": "consider",
    "is able to": "can",
    "has the ability to": "can",
    "with the exception of": "except",
    "in light of the fact that": "because",
    "until such time as": "until",
    "in the near future": "soon",
    "as a matter of fact": "in fact",
    "it is important to note that": "note that"
  };

  return Object.entries(verbosePhrases).reduce((result, [from, to]) => {
    return result.replace(new RegExp(from, 'gi'), to);
  }, text);
};

export default ToneAdjuster;