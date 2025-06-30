'use client';

import React, { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import axios from 'axios';

// Dynamically import Plot to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), { ssr: false });

const EmbeddingVisualizer = () => {
  const [sentences, setSentences] = useState([]);
  const [newSentence, setNewSentence] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [plotData, setPlotData] = useState([]);
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
  useEffect(() => {
    const visibleSentenceData = sentences.filter(s => visibleSentences.has(s.id));
    
    if (visibleSentenceData.length === 0) {
      setPlotData([]);
      return;
    }

    const plotTrace = {
      x: visibleSentenceData.map(s => s.embedding.x),
      y: visibleSentenceData.map(s => s.embedding.y),
      text: visibleSentenceData.map(s => s.text),
      mode: 'markers+text',
      type: 'scatter',
      marker: {
        size: 12,
        color: visibleSentenceData.map((_, i) => i),
        colorscale: 'Viridis',
        opacity: 0.8,
        line: {
          color: 'white',
          width: 2
        }
      },
      textposition: 'top center',
      textfont: {
        size: 10,
        color: 'black'
      },
      hovertemplate: '<b>%{text}</b><br>X: %{x:.2f}<br>Y: %{y:.2f}<extra></extra>',
      name: 'Sentences'
    };

    setPlotData([plotTrace]);
  }, [sentences, visibleSentences]);

  const plotLayout = {
    title: {
      text: 'Sentence Embeddings Visualization',
      font: { size: 20 }
    },
    xaxis: {
      title: 'Embedding Dimension 1',
      gridcolor: '#e0e0e0',
      zerolinecolor: '#d0d0d0'
    },
    yaxis: {
      title: 'Embedding Dimension 2',
      gridcolor: '#e0e0e0',
      zerolinecolor: '#d0d0d0'
    },
    plot_bgcolor: '#fafafa',
    paper_bgcolor: 'white',
    hovermode: 'closest',
    autosize: true,
    margin: { t: 50, b: 50, l: 50, r: 50 }
  };

  const plotConfig = {
    responsive: true,
    displayModeBar: true,
    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d'],
    displaylogo: false,
    toImageButtonOptions: {
      format: 'png',
      filename: 'embedding_visualization',
      height: 500,
      width: 800,
      scale: 1
    }
  };

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
          >
            {isLoading ? 'Adding...' : 'Add Sentence'}
          </button>
        </div>
        
        <div className="action-buttons">
          <button 
            onClick={addSampleSentences} 
            disabled={isLoading}
            className="sample-btn"
          >
            Add Sample Sentences
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
          {plotData.length > 0 ? (
            <Plot
              data={plotData}
              layout={plotLayout}
              config={plotConfig}
              style={{ width: '100%', height: '600px' }}
            />
          ) : (
            <div className="empty-plot">
              <p>Add sentences to see the visualization</p>
            </div>
          )}
        </div>

        <div className="sentence-list">
          <h3>Sentences ({sentences.length})</h3>
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
                <div className="sentence-text">
                  {sentence.text}
                </div>
                <div className="sentence-coords">
                  ({sentence.embedding.x.toFixed(2)}, {sentence.embedding.y.toFixed(2)})
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
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }

        .header {
          text-align: center;
          margin-bottom: 30px;
        }

        .header h1 {
          color: #333;
          margin-bottom: 10px;
        }

        .header p {
          color: #666;
          font-size: 16px;
        }

        .error-message {
          background: #fee;
          color: #d00;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 20px;
          text-align: center;
        }

        .input-section {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }

        .sentence-input {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        }

        .sentence-input input {
          flex: 1;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
        }

        .sentence-input input:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
        }

        .sentence-input button {
          padding: 12px 20px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          white-space: nowrap;
        }

        .sentence-input button:hover:not(:disabled) {
          background: #0056b3;
        }

        .sentence-input button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .action-buttons {
          display: flex;
          gap: 10px;
        }

        .sample-btn {
          padding: 10px 16px;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .sample-btn:hover:not(:disabled) {
          background: #218838;
        }

        .clear-btn {
          padding: 10px 16px;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .clear-btn:hover:not(:disabled) {
          background: #c82333;
        }

        .clear-btn:disabled, .sample-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .main-content {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 20px;
        }

        @media (max-width: 1024px) {
          .main-content {
            grid-template-columns: 1fr;
          }
        }

        .plot-container {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .empty-plot {
          height: 600px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #666;
          font-size: 18px;
        }

        .sentence-list {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          padding: 20px;
        }

        .sentence-list h3 {
          margin-top: 0;
          margin-bottom: 15px;
          color: #333;
        }

        .sentence-items {
          max-height: 520px;
          overflow-y: auto;
        }

        .sentence-item {
          display: flex;
          align-items: flex-start;
          padding: 12px;
          border: 1px solid #eee;
          border-radius: 4px;
          margin-bottom: 8px;
          background: #fafafa;
        }

        .sentence-controls {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-right: 12px;
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
          width: 18px;
          height: 18px;
          background: #fff;
          border: 2px solid #ddd;
          border-radius: 3px;
          position: relative;
        }

        .visibility-toggle input:checked + .checkmark {
          background: #007bff;
          border-color: #007bff;
        }

        .visibility-toggle input:checked + .checkmark::after {
          content: '✓';
          position: absolute;
          top: -2px;
          left: 2px;
          color: white;
          font-size: 12px;
          font-weight: bold;
        }

        .remove-btn {
          width: 18px;
          height: 18px;
          background: #dc3545;
          color: white;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          font-size: 12px;
          line-height: 1;
          padding: 0;
        }

        .remove-btn:hover {
          background: #c82333;
        }

        .sentence-text {
          flex: 1;
          font-size: 14px;
          line-height: 1.4;
          margin-bottom: 4px;
        }

        .sentence-coords {
          font-size: 12px;
          color: #666;
          font-family: monospace;
        }
      `}</style>
    </div>
  );
};

export default EmbeddingVisualizer;