'use client';

import React, { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import D3ScatterPlot from './D3ScatterPlot';

const EmbeddingVisualizer = () => {
  const [sentences, setSentences] = useState([]);
  const [newSentence, setNewSentence] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [visibleSentences, setVisibleSentences] = useState(new Set());
  const [error, setError] = useState('');

  // Sample sentences for demo purposes
  const sampleSentences = [
    "I love programming in Python",
    "JavaScript is a versatile language",
    "Machine learning is fascinating",
    "Deep learning models are powerful",
    "Natural language processing helps computers understand text",
    "The weather is beautiful today",
    "I enjoy reading books",
    "Artificial intelligence will change the world",
    "Data science involves statistics and programming",
    "Cats are adorable pets"
  ];

  // Mock function to generate embeddings (replace with actual API call)
  const generateEmbedding = async (text) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Generate mock 2D embeddings based on text characteristics
    // In reality, this would be a call to your FastAPI backend
    const textLength = text.length;
    const wordCount = text.split(' ').length;
    const hasAI = text.toLowerCase().includes('ai') || 
                  text.toLowerCase().includes('machine') || 
                  text.toLowerCase().includes('learning') ||
                  text.toLowerCase().includes('programming') ||
                  text.toLowerCase().includes('computer');
    
    const x = (textLength * 0.1) + (Math.random() - 0.5) * 2 + (hasAI ? 3 : -3);
    const y = (wordCount * 0.5) + (Math.random() - 0.5) * 2 + (hasAI ? 2 : -2);
    
    return { x, y };
  };

  // Function to add a new sentence
  const addSentence = useCallback(async () => {
    if (!newSentence.trim()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const embedding = await generateEmbedding(newSentence);
      const newSentenceObj = {
        id: Date.now(),
        text: newSentence.trim(),
        embedding,
        visible: true
      };
      
      setSentences(prev => [...prev, newSentenceObj]);
      setVisibleSentences(prev => new Set([...prev, newSentenceObj.id]));
      setNewSentence('');
    } catch (err) {
      setError('Failed to generate embedding. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [newSentence]);

  // Function to add sample sentences
  const addSampleSentences = useCallback(async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const newSentences = [];
      for (const sentence of sampleSentences) {
        const embedding = await generateEmbedding(sentence);
        newSentences.push({
          id: Date.now() + Math.random(),
          text: sentence,
          embedding,
          visible: true
        });
      }
      
      setSentences(prev => [...prev, ...newSentences]);
      setVisibleSentences(prev => {
        const newSet = new Set(prev);
        newSentences.forEach(s => newSet.add(s.id));
        return newSet;
      });
    } catch (err) {
      setError('Failed to generate embeddings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

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
  const clearAllSentences = useCallback(() => {
    setSentences([]);
    setVisibleSentences(new Set());
  }, []);

  // Update plot data when sentences or visibility changes
  const visibleSentenceData = sentences.filter(s => visibleSentences.has(s.id));

  return (
    <div className="embedding-visualizer">
      <div className="header">
        <h1>Embedding Visualizer</h1>
        <p>Add sentences to see how they cluster in 2D embedding space</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="input-section">
        <div className="sentence-input">
          <input
            type="text"
            value={newSentence}
            onChange={(e) => setNewSentence(e.target.value)}
            placeholder="Enter a sentence to visualize..."
            onKeyPress={(e) => e.key === 'Enter' && addSentence()}
            disabled={isLoading}
          />
          <button 
            onClick={addSentence} 
            disabled={isLoading || !newSentence.trim()}
            className="primary-btn"
          >
            {isLoading ? 'Adding...' : 'Add'}
          </button>
        </div>
        
        <div className="action-buttons">
          <button 
            onClick={addSampleSentences} 
            disabled={isLoading}
            className="secondary-btn"
          >
            Add Samples
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
        }

        .input-section {
          background: white;
          padding: 24px;
          border-radius: 12px;
          margin-bottom: 24px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
        }

        .sentence-input {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .sentence-input input {
          flex: 1;
          padding: 12px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          background: #fafbff;
          color: #1e293b;
          transition: all 0.2s;
        }

        .sentence-input input::placeholder {
          color: #94a3b8;
        }

        .sentence-input input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
          background: white;
          color: #0f172a;
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
          transition: all 0.2s;
          white-space: nowrap;
        }

        .primary-btn:hover:not(:disabled) {
          background: #5856eb;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .primary-btn:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .action-buttons {
          display: flex;
          gap: 8px;
        }

        .secondary-btn {
          padding: 8px 16px;
          background: #f8fafc;
          color: #475569;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          transition: all 0.2s;
        }

        .secondary-btn:hover:not(:disabled) {
          background: #f1f5f9;
          border-color: #cbd5e1;
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
          transition: all 0.2s;
        }

        .clear-btn:hover:not(:disabled) {
          background: #f1f5f9;
          color: #475569;
        }

        .secondary-btn:disabled, .clear-btn:disabled {
          background: #f8fafc;
          color: #cbd5e1;
          cursor: not-allowed;
        }

        .main-content {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 24px;
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
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .sentence-list {
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          padding: 20px;
          box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
          height: fit-content;
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
          transition: all 0.2s;
        }

        .sentence-item:hover {
          border-color: #e2e8f0;
          background: white;
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
          transition: all 0.2s;
        }

        .visibility-toggle input:checked + .checkmark {
          background: #6366f1;
          border-color: #6366f1;
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
          transition: all 0.2s;
        }

        .remove-btn:hover {
          background: #fef2f2;
          color: #dc2626;
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

          .input-section {
            padding: 20px;
          }

          .sentence-input {
            flex-direction: column;
            gap: 12px;
          }

          .action-buttons {
            flex-direction: column;
            gap: 8px;
          }

          .secondary-btn, .clear-btn {
            width: 100%;
            text-align: center;
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
            padding: 12px;
          }

          .header h1 {
            font-size: 24px;
          }

          .header p {
            font-size: 14px;
          }

          .input-section {
            padding: 16px;
          }

          .sentence-input input {
            padding: 10px 14px;
            font-size: 16px; /* Prevent zoom on iOS */
            color: #1e293b;
          }

          .sentence-input input:focus {
            color: #0f172a;
          }

          .primary-btn {
            padding: 10px 16px;
            font-size: 14px;
          }

          .secondary-btn, .clear-btn {
            padding: 8px 14px;
            font-size: 13px;
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
      `}</style>
    </div>
  );
};

export default EmbeddingVisualizer;