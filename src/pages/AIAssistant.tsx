import React, { useState } from 'react';
import { aiService, AskResponse } from '../services/aiService';

export const AIAssistant: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState<AskResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    try {
      const res = await aiService.askQuestion(question);
      setResponse(res);
    } catch (err) {
      console.error('Error asking AI:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2>RAG Task Assistant</h2>
      <form onSubmit={handleAsk} style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask something about your tasks (e.g., What high priority tasks do I have?)"
          style={{ flex: 1, padding: '0.75rem', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button type="submit" disabled={loading} style={{ padding: '0.75rem 1.5rem', cursor: 'pointer' }}>
          {loading ? 'Searching...' : 'Ask'}
        </button>
      </form>

      {response && (
        <div style={{ backgroundColor: '#f9f9f9', padding: '1.5rem', borderRadius: '8px' }}>
          <h3>Answer:</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{response.answer}</p>

          <h4 style={{ marginTop: '1.5rem' }}>Retrieved Context (FAISS Top Hits):</h4>
          <ul>
            {response.retrieved_context.map((task) => (
              <li key={task.id}>
                <strong>{task.title}</strong> [{task.status}] - {task.description}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
