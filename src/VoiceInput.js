import { useState, useEffect, useRef } from 'react';
import { FiMic, FiMicOff } from 'react-icons/fi';

const VoiceInput = ({ onTextChange }) => {
  const [isListening, setIsListening] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const recognitionRef = useRef(null);

  // Check if speech recognition is available
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsAvailable(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onstart = () => {
        setStatusMessage('Listening... Speak now');
      };

      recognitionRef.current.onerror = (event) => {
        setStatusMessage(`Error: ${event.error}`);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          recognitionRef.current.start();
        } else {
          setStatusMessage('Press microphone to start speaking');
        }
      };

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        setTranscript(finalTranscript + interimTranscript);
        onTextChange(finalTranscript + interimTranscript);
      };
    } else {
      setStatusMessage('Speech recognition not supported in your browser');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening, onTextChange]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setStatusMessage('Voice input stopped');
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        setStatusMessage(`Error: ${err.message}`);
      }
    }
  };

  return (
    <div className="voice-input">
      {isAvailable ? (
        <>
          <button
            onClick={toggleListening}
            className={`mic-button ${isListening ? 'listening' : ''}`}
            disabled={!isAvailable}
          >
            {isListening ? <FiMicOff /> : <FiMic />}
            {isListening ? ' Stop' : ' Voice Input'}
          </button>
          <div className="status-message">{statusMessage}</div>
          {transcript && (
            <div className="transcript-preview">
              <p>{transcript}</p>
            </div>
          )}
        </>
      ) : (
        <div className="browser-warning">
          Voice input is not supported in your browser. Try Chrome or Edge.
        </div>
      )}
    </div>
  );
};

export default VoiceInput;