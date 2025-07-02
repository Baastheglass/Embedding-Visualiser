'use client';

import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import D3ScatterPlot from './D3ScatterPlot';

const EmbeddingVisualizer = () => {
  const [sentences, setSentences] = useState([]);
  const [inputSentences, setInputSentences] = useState(['']); // Array of input sentences
  const [isLoading, setIsLoading] = useState(false);
  const [visibleSentences, setVisibleSentences] = useState(new Set());
  const [error, setError] = useState('');



  // Function to generate embeddings for multiple sentences using existing endpoint
  const generateBatchEmbeddings = async (sentencesArray) => {
    try {
      // Send all sentences as a single text string, separated by newlines
      
      const response = await axios.post('https://visualiser-backend.axonbuild.com/getEmbeddings', {
        text: sentencesArray
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      console.log('Backend response:', response.data);
      
      // The backend returns all embeddings and sentences
      const { embeddings, sentences: returnedSentences } = response.data;
      
      if (!embeddings || !returnedSentences) {
        throw new Error('Invalid response format from backend');
      }
      
      // Map each sentence to its embedding
      return returnedSentences.map((sentence, index) => ({
        text: sentence.trim(),
        embedding: {
          x: embeddings[index][0],
          y: embeddings[index][1]
        }
      }));
      
    } catch (error) {
      console.error('API Error:', error);
      
      if (error.response) {
        const statusCode = error.response.status;
        const errorMessage = error.response.data?.detail || error.response.data?.message || 'Unknown error';
        
        if (statusCode === 400) {
          throw new Error(errorMessage);
        } else if (statusCode === 500) {
          throw new Error(`Server error: ${errorMessage}`);
        } else {
          throw new Error(`HTTP ${statusCode}: ${errorMessage}`);
        }
      } else if (error.request) {
        throw new Error('Cannot connect to the backend server. Make sure it\'s running on https://visualiser-backend.axonbuild.com/');
      } else {
        throw new Error(`Request error: ${error.message}`);
      }
    }
  };

  // Function to process and add multiple sentences
  const processSentences = useCallback(async () => {
    // Filter out empty sentences
    const validSentences = inputSentences
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    if (validSentences.length === 0) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // Send all sentences as batch to backend using existing endpoint
      const embeddingResults = await generateBatchEmbeddings(validSentences);
      
      // Create sentence objects with unique IDs
      const newSentenceObjs = embeddingResults.map((result, index) => ({
        id: Date.now() + index,
        text: result.text,
        embedding: result.embedding,
        visible: true
      }));
      
      // Update state with all new sentences
      setSentences(prev => [...prev, ...newSentenceObjs]);
      setVisibleSentences(prev => {
        const newSet = new Set(prev);
        newSentenceObjs.forEach(s => newSet.add(s.id));
        return newSet;
      });
      setInputSentences(['']); // Reset to single empty input
      
    } catch (err) {
      setError(`Failed to generate embeddings: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [inputSentences]);

  // Functions to manage input sentences
  const addInputField = useCallback(() => {
    setInputSentences(prev => [...prev, '']);
  }, []);

  const removeInputField = useCallback((index) => {
    if (inputSentences.length > 1) {
      setInputSentences(prev => prev.filter((_, i) => i !== index));
    }
  }, [inputSentences.length]);

  const updateInputSentence = useCallback((index, value) => {
    setInputSentences(prev => prev.map((sentence, i) => i === index ? value : sentence));
  }, []);

  // Check if there are any non-empty sentences to process
  const hasValidInput = inputSentences.some(s => s.trim().length > 0);



  // Function to toggle sentence visibility
  const toggleSentenceVisibility = useCallback((id) => {
    setVisibleSentences(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Function to remove a sentence
  const removeSentence = useCallback((id) => {
    setSentences(prev => prev.filter(s => s.id !== id));
    setVisibleSentences(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);

  // Function to clear all sentences
  const clearAllSentences = useCallback(async () => {
    try {
      // Clear local state
      setSentences([]);
      setVisibleSentences(new Set());
      setError('');
    } catch (err) {
      console.error('Failed to clear local data:', err);
    }
  }, []);

  // Update plot data when sentences or visibility changes
  const visibleSentenceData = sentences.filter(s => visibleSentences.has(s.id));

  return (
    <div className="embedding-visualizer">
      <div className="header">
        <h1>Embedding Visualizer</h1>
        <p>Add multiple sentences using the input fields below to see how they cluster in 2D embedding space</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="input-section">
        <div className="sentence-input">
          <div className="input-fields">
            {inputSentences.map((sentence, index) => (
              <div key={index} className="input-field-row">
                <input
                  type="text"
                  value={sentence}
                  onChange={(e) => updateInputSentence(index, e.target.value)}
                  placeholder="Enter text"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => removeInputField(index)}
                  disabled={inputSentences.length === 1 || isLoading}
                  className="remove-input-btn"
                  title="Remove this sentence"
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addInputField}
              disabled={isLoading}
              className="add-input-btn"
            >
              + Add Another Sentence
            </button>
          </div>
          <div className="button-group">
            <button 
              onClick={processSentences} 
              disabled={isLoading || !hasValidInput}
              className="primary-btn"
            >
              {isLoading ? 'Processing...' : 'Process Sentences'}
            </button>
            <button 
              onClick={clearAllSentences} 
              disabled={sentences.length === 0}
              className="clear-btn"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="plot-container">
          {visibleSentenceData.length > 0 ? (
            <D3ScatterPlot
              data={visibleSentenceData}
              width={typeof window !== 'undefined' && window.innerWidth <= 480 ? 350 : 
                     typeof window !== 'undefined' && window.innerWidth <= 768 ? 600 : 800}
              height={typeof window !== 'undefined' && window.innerWidth <= 480 ? 300 : 
                      typeof window !== 'undefined' && window.innerWidth <= 768 ? 400 : 500}
              onPointHover={(point) => console.log('Hovered:', point.text)}
              onPointClick={(point) => console.log('Clicked:', point.text)}
            />
          ) : (
            <div className="empty-plot">
              <div className="empty-icon">📊</div>
              <p>Add sentences to see the visualization</p>
            </div>
          )}
        </div>

        <div className="sentence-list">
          <h3>Sentences <span className="count">({sentences.length})</span></h3>
          <div className="sentence-items">
            {sentences.map((sentence) => (
              <div key={sentence.id} className="sentence-item">
                <div className="sentence-controls">
                  <label className="visibility-toggle">
                    <input
                      type="checkbox"
                      checked={visibleSentences.has(sentence.id)}
                      onChange={() => toggleSentenceVisibility(sentence.id)}
                    />
                    <span className="checkmark"></span>
                  </label>
                  <button
                    onClick={() => removeSentence(sentence.id)}
                    className="remove-btn"
                    title="Remove sentence"
                  >
                    ×
                  </button>
                </div>
                <div className="sentence-content">
                  <div className="sentence-text">
                    {sentence.text}
                  </div>
                  <div className="sentence-coords">
                    ({sentence.embedding.x.toFixed(2)}, {sentence.embedding.y.toFixed(2)})
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        .embedding-visualizer {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #fafbff;
          min-height: 100vh;
        }

        .header {
          text-align: center;
          margin-bottom: 32px;
          animation: fadeInDown 0.6s ease;
        }

        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .header h1 {
          color: #1e293b;
          margin: 0 0 8px 0;
          font-size: 28px;
          font-weight: 600;
          letter-spacing: -0.025em;
        }

        .header p {
          color: #64748b;
          font-size: 16px;
          margin: 0;
        }

        .error-message {
          background: #fef2f2;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          text-align: center;
          border: 1px solid #fecaca;
          font-size: 14px;
          animation: slideInDown 0.4s ease;
        }

        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .input-section {
          background: white;
          padding: 24px;
          border-radius: 12px;
          margin-bottom: 28px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
          transition: all 0.3s ease;
          animation: fadeInUp 0.6s ease 0.2s both;
        }

        .input-section:hover {
          box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.1), 0 2px 4px 0 rgba(0, 0, 0, 0.06);
          transform: translateY(-1px);
        }

        .sentence-input {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
          align-items: flex-start;
        }

        .input-fields {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .input-field-row {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .input-field-row input {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          background: #fafbff;
          color: #1e293b;
          transition: all 0.3s ease;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          box-sizing: border-box;
        }

        .input-field-row input::placeholder {
          color: #94a3b8;
          transition: color 0.3s ease;
        }

        .input-field-row input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
          background: white;
          color: #0f172a;
          transform: scale(1.01);
        }

        .remove-input-btn {
          width: 32px;
          height: 32px;
          background: #f1f5f9;
          color: #64748b;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          line-height: 1;
          padding: 0;
          transition: all 0.3s ease;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .remove-input-btn:hover:not(:disabled) {
          background: #fef2f2;
          color: #dc2626;
          border-color: #fecaca;
          transform: scale(1.1);
        }

        .remove-input-btn:disabled {
          background: #f8fafc;
          color: #cbd5e1;
          cursor: not-allowed;
          transform: none;
        }

        .add-input-btn {
          padding: 8px 12px;
          background: #f8fafc;
          color: #6366f1;
          border: 1px dashed #cbd5e1;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.3s ease;
          margin-top: 4px;
        }

        .add-input-btn:hover:not(:disabled) {
          background: #f1f5f9;
          border-color: #6366f1;
          color: #5856eb;
          transform: translateY(-1px);
        }

        .add-input-btn:disabled {
          background: #f8fafc;
          color: #cbd5e1;
          cursor: not-allowed;
        }

        .button-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex-shrink: 0;
          min-width: 160px;
        }

        .primary-btn {
          padding: 12px 20px;
          background: #6366f1;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.3s ease;
          white-space: nowrap;
          height: fit-content;
          min-width: 140px;
          box-sizing: border-box;
          position: relative;
          overflow: hidden;
        }

        .primary-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s ease;
        }

        .primary-btn:hover::before {
          left: 100%;
        }

        .primary-btn:hover:not(:disabled) {
          background: #5856eb;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
          background-image: linear-gradient(
            45deg,
            transparent 30%,
            rgba(255, 255, 255, 0.2) 50%,
            transparent 70%
          );
          background-size: 200px 100%;
          animation: shimmer 2s infinite;
        }

        .primary-btn:active:not(:disabled) {
          transform: translateY(0px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .primary-btn:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        @keyframes shimmer {
          0% { background-position: -200px 0; }
          100% { background-position: calc(200px + 100%) 0; }
        }

        .clear-btn {
          padding: 8px 16px;
          background: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.3s ease;
          min-width: 140px;
          box-sizing: border-box;
          position: relative;
          overflow: hidden;
        }

        .clear-btn:hover:not(:disabled) {
          background: #f1f5f9;
          color: #475569;
          border-color: #cbd5e1;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .clear-btn:active:not(:disabled) {
          transform: translateY(0px);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .clear-btn:disabled {
          background: #f8fafc;
          color: #cbd5e1;
          cursor: not-allowed;
        }

        .main-content {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 24px;
          animation: fadeInUp 0.6s ease;
        }

        @media (max-width: 1024px) {
          .main-content {
            grid-template-columns: 1fr;
          }
        }

        .plot-container {
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
          transition: all 0.3s ease;
        }

        .plot-container:hover {
          box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.1), 0 2px 4px 0 rgba(0, 0, 0, 0.06);
          transform: translateY(-1px);
        }

        .empty-plot {
          height: 500px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #64748b;
          font-size: 16px;
          background: #fafbff;
          animation: fadeIn 0.6s ease;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .sentence-list {
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          padding: 20px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
          height: fit-content;
          transition: all 0.3s ease;
        }

        .sentence-list:hover {
          box-shadow: 0 4px 12px 0 rgba(0, 0, 0, 0.1), 0 2px 4px 0 rgba(0, 0, 0, 0.06);
          transform: translateY(-1px);
        }

        .sentence-list h3 {
          margin: 0 0 16px 0;
          color: #1e293b;
          font-size: 18px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .count {
          color: #64748b;
          font-weight: 400;
          font-size: 14px;
          transition: all 0.3s ease;
          display: inline-block;
        }

        .count:hover {
          color: #6366f1;
          transform: scale(1.1);
        }

        .sentence-items {
          max-height: 480px;
          overflow-y: auto;
        }

        .sentence-items::-webkit-scrollbar {
          width: 6px;
        }

        .sentence-items::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }

        .sentence-items::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
        }

        .sentence-items::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        .sentence-item {
          display: flex;
          align-items: flex-start;
          padding: 12px;
          border: 1px solid #f1f5f9;
          border-radius: 8px;
          margin-bottom: 8px;
          background: #fafbff;
          transition: all 0.3s ease;
          opacity: 0;
          animation: fadeInUp 0.4s ease forwards;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .sentence-item:hover {
          border-color: #e2e8f0;
          background: white;
          transform: translateX(4px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .sentence-controls {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .visibility-toggle {
          position: relative;
          cursor: pointer;
        }

        .visibility-toggle input[type="checkbox"] {
          opacity: 0;
          position: absolute;
        }

        .checkmark {
          display: block;
          width: 16px;
          height: 16px;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 4px;
          position: relative;
          transition: all 0.3s ease;
        }

        .checkmark:hover {
          border-color: #6366f1;
          transform: scale(1.1);
        }

        .visibility-toggle input:checked + .checkmark {
          background: #6366f1;
          border-color: #6366f1;
          transform: scale(1.1);
        }

        .visibility-toggle input:checked + .checkmark::after {
          content: '✓';
          position: absolute;
          top: -1px;
          left: 1px;
          color: white;
          font-size: 10px;
          font-weight: bold;
        }

        .remove-btn {
          width: 16px;
          height: 16px;
          background: #f1f5f9;
          color: #64748b;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          font-size: 10px;
          line-height: 1;
          padding: 0;
          transition: all 0.3s ease;
        }

        .remove-btn:hover {
          background: #fef2f2;
          color: #dc2626;
          transform: scale(1.2) rotate(90deg);
          box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
        }

        .sentence-content {
          flex: 1;
          min-width: 0;
        }

        .sentence-text {
          font-size: 14px;
          line-height: 1.4;
          margin-bottom: 4px;
          color: #1e293b;
          word-wrap: break-word;
        }

        .sentence-coords {
          font-size: 11px;
          color: #94a3b8;
          font-family: ui-monospace, 'SF Mono', Consolas, monospace;
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .embedding-visualizer {
            padding: 16px;
          }

          .header {
            margin-bottom: 28px;
          }

          .input-section {
            padding: 20px;
            margin-bottom: 28px;
          }

          .sentence-input {
            flex-direction: column;
            gap: 16px;
            margin-bottom: 16px;
          }

          .input-fields {
            width: 100%;
          }

          .input-field-row {
            gap: 12px;
          }

          .input-field-row input {
            font-size: 14px;
            padding: 14px 16px;
          }

          .remove-input-btn {
            width: 36px;
            height: 36px;
            font-size: 16px;
          }

          .add-input-btn {
            padding: 12px 16px;
            font-size: 14px;
            margin-top: 8px;
          }

          .button-group {
            gap: 12px;
            align-items: stretch;
            width: 100%;
          }

          .primary-btn {
            width: 100%;
            text-align: center;
            min-width: unset;
          }

          .clear-btn {
            width: 100%;
            text-align: center;
            min-width: unset;
          }

          .plot-container {
            margin-bottom: 20px;
          }

          .empty-plot {
            height: 350px;
            font-size: 14px;
          }

          .empty-icon {
            font-size: 40px;
          }

          .sentence-list {
            padding: 16px;
          }

          .sentence-items {
            max-height: 300px;
          }

          .main-content {
            gap: 16px;
          }
        }

        @media (max-width: 480px) {
          .embedding-visualizer {
            padding: 16px;
          }

          .header {
            margin-bottom: 32px;
          }

          .header h1 {
            font-size: 24px;
            margin-bottom: 12px;
          }

          .header p {
            font-size: 14px;
          }

          .input-section {
            padding: 20px;
            margin-bottom: 32px;
          }

          .sentence-input {
            gap: 20px;
            margin-bottom: 20px;
          }

          .input-field-row input {
            padding: 16px 20px;
            font-size: 16px; /* Prevent zoom on iOS */
            color: #1e293b;
          }

          .input-field-row input:focus {
            color: #0f172a;
          }

          .remove-input-btn {
            width: 44px;
            height: 44px;
            font-size: 18px;
          }

          .add-input-btn {
            padding: 16px 20px;
            font-size: 16px;
            margin-top: 12px;
            min-height: 48px;
          }

          .primary-btn {
            padding: 16px 20px;
            font-size: 16px;
            width: 100%;
            min-height: 48px; /* Better touch target */
            min-width: unset;
          }

          .clear-btn {
            padding: 14px 24px;
            font-size: 14px;
            min-height: 48px;
            width: 100%;
            min-width: unset;
          }

          .main-content {
            gap: 28px;
            margin-top: 8px;
          }

          .empty-plot {
            height: 280px;
            font-size: 13px;
          }

          .empty-icon {
            font-size: 36px;
          }

          .sentence-list {
            padding: 14px;
          }

          .sentence-items {
            max-height: 250px;
          }

          .sentence-item {
            padding: 10px;
            margin-bottom: 6px;
          }

          .sentence-text {
            font-size: 13px;
          }

          .sentence-coords {
            font-size: 10px;
          }
        }

        @media (max-width: 360px) {
          .embedding-visualizer {
            padding: 12px;
          }

          .header {
            margin-bottom: 28px;
          }

          .header h1 {
            font-size: 22px;
            margin-bottom: 10px;
          }

          .input-section {
            padding: 16px;
            margin-bottom: 28px;
          }

          .sentence-input {
            margin-bottom: 16px;
          }

          .input-field-row input {
            padding: 14px 16px;
            font-size: 16px;
          }

          .remove-input-btn {
            width: 40px;
            height: 40px;
            font-size: 16px;
          }

          .add-input-btn {
            padding: 12px 16px;
            font-size: 15px;
            margin-top: 10px;
            min-height: 44px;
          }

          .primary-btn {
            padding: 14px 16px;
            font-size: 15px;
            min-height: 44px;
            width: 100%;
            min-width: unset;
          }

          .clear-btn {
            padding: 12px 20px;
            font-size: 13px;
            min-height: 44px;
            width: 100%;
            min-width: unset;
          }

          .main-content {
            gap: 24px;
            margin-top: 4px;
          }

          .plot-container {
            margin-bottom: 4px;
          }
        }
      `}</style>
    </div>
  );
};

export default EmbeddingVisualizer;