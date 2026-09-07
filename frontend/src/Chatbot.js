import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { FaArrowRight, FaBars, FaPlus, FaTrash, FaTimes } from 'react-icons/fa';
import './Chatbot.css';

const STORAGE_KEY = 'chatbot.threads.v2';

const makeThread = () => ({
  id: `thread-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: 'New conversation',
  updatedAt: Date.now(),
  messages: [],
});

const readThreads = () => {
  try {
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    if (Array.isArray(stored) && stored.length) return stored;
  } catch (error) {
    console.warn('Could not restore chat history', error);
  }
  const first = makeThread();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([first]));
  return [first];
};

const threadFromPath = () => window.location.pathname.match(/^\/chat\/([^/]+)$/)?.[1];

const Chatbot = () => {
  const [threads, setThreads] = useState(readThreads);
  const [activeId, setActiveId] = useState(() => threadFromPath() || readThreads()[0]?.id);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const inputRef = useRef(null);
  const feedRef = useRef(null);

  const activeThread = useMemo(
    () => threads.find((thread) => thread.id === activeId) || threads[0],
    [activeId, threads]
  );

  const persist = useCallback((updater) => {
    setThreads((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const openThread = useCallback((id) => {
    setActiveId(id);
    window.history.pushState({}, '', `/chat/${id}`);
    setSidebarOpen(false);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    if (!threads.some((thread) => thread.id === activeId)) {
      openThread(threads[0].id);
    } else if (!threadFromPath()) {
      window.history.replaceState({}, '', `/chat/${activeId}`);
    }
  }, [activeId, openThread, threads]);

  useEffect(() => {
    const handlePopState = () => {
      const id = threadFromPath();
      if (id && threads.some((thread) => thread.id === id)) setActiveId(id);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [threads]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [activeId, loading]);

  useEffect(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' });
  }, [activeThread?.messages, loading]);

  const createThread = () => {
    const next = makeThread();
    persist((current) => [next, ...current]);
    openThread(next.id);
  };

  const deleteThread = (event, id) => {
    event.stopPropagation();
    const remaining = threads.filter((thread) => thread.id !== id);
    if (!remaining.length) {
      const replacement = makeThread();
      persist([replacement]);
      openThread(replacement.id);
      return;
    }
    persist(remaining);
    if (id === activeId) openThread(remaining[0].id);
  };

  const updateActive = (message) => {
    persist((current) => current
      .map((thread) => thread.id === activeId
        ? {
            ...thread,
            title: thread.messages.length === 0 && message.role === 'user'
              ? message.parts[0].text.slice(0, 42)
              : thread.title,
            updatedAt: Date.now(),
            messages: [...thread.messages, message],
          }
        : thread)
      .sort((a, b) => b.updatedAt - a.updatedAt));
  };

  const handleSend = async (event) => {
    event?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    updateActive({ id: `user-${Date.now()}`, role: 'user', parts: [{ type: 'text', text }], createdAt: Date.now() });
    setInput('');
    setLoading(true);

    try {
      const response = await axios.get(`http://localhost:8080/ai/chat/string?message=${encodeURIComponent(text)}`);
      updateActive({
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        parts: [{ type: 'text', text: String(response.data) }],
        createdAt: Date.now(),
      });
    } catch (error) {
      console.error('Error fetching AI response', error);
      updateActive({
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        parts: [{ type: 'text', text: 'I couldn’t reach the assistant just now. Please try again.' }],
        createdAt: Date.now(),
        error: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const sortedThreads = [...threads].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="chatbot-shell">
      <div className="chatbot-window">
        <aside className={`thread-panel ${sidebarOpen ? 'is-open' : ''}`}>
          <div className="thread-panel-top">
            <div className="brand-row">
              <span className="brand-mark">Spring Bot</span>
              <button className="icon-button mobile-close" onClick={() => setSidebarOpen(false)} aria-label="Close conversations">
                <FaTimes />
              </button>
            </div>
            <button className="new-thread-button" onClick={createThread}>
              <span>New Thread</span>
              <FaPlus aria-hidden="true" />
            </button>
          </div>

          <nav className="thread-list" aria-label="Recent conversations">
            <p className="thread-label">Recent conversations</p>
            {sortedThreads.map((thread) => (
              <div key={thread.id} className={`thread-row ${thread.id === activeId ? 'active' : ''}`}>
                <button className="thread-select" onClick={() => openThread(thread.id)}>
                  <strong>{thread.title}</strong>
                  <span>{thread.messages.at(-1)?.parts?.[0]?.text || 'Start a new thought'}</span>
                </button>
                <button className="thread-delete" onClick={(event) => deleteThread(event, thread.id)} aria-label={`Delete ${thread.title}`} title="Delete conversation">
                  <FaTrash />
                </button>
              </div>
            ))}
          </nav>

          <div className="profile-row">
            <span className="profile-dot">AI</span>
            <div><strong>Chatbot</strong><span>Always ready</span></div>
          </div>
        </aside>

        {sidebarOpen && <button className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Close conversations" />}

        <main className="chat-main">
          <header className="chat-header">
            <button className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open conversations">
              <FaBars />
            </button>
            <div>
              <span>Bedouin Conversation</span>
              <h1>{activeThread?.title}</h1>
            </div>
            <span className="status"><i /> Online</span>
          </header>

          <div className="conversation" ref={feedRef}>
            {activeThread?.messages.length === 0 && (
              <div className="empty-state">
                <img src="/spear.png" alt="Chatbot assistant" />
                <span>New conversation</span>
                <h2>What are we exploring today?</h2>
                <p>Share a question, an idea, or a half-formed thought.</p>
              </div>
            )}

            {activeThread?.messages.map((message) => (
              <article className={`message-row ${message.role}`} key={message.id}>
                {message.role === 'assistant' && (
                  <div className="assistant-label"><span>AI</span><em>Chatbot</em></div>
                )}
                <div className={`message-content ${message.error ? 'error' : ''}`}>
                  {message.parts.map((part, index) => part.type === 'text' ? <p key={index}>{part.text}</p> : null)}
                </div>
                <time>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>
              </article>
            ))}

            {loading && (
              <article className="message-row assistant loading-message">
                <div className="assistant-label"><span>AI</span><em>Chatbot</em></div>
                <div className="thinking">Thinking<span>…</span></div>
              </article>
            )}
          </div>

          <footer className="composer-wrap">
            <form className="composer" onSubmit={handleSend}>
              <textarea
                ref={inputRef}
                rows="1"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) handleSend(event);
                }}
                placeholder="Ask anything…"
                aria-label="Message Chatbot"
              />
              <button type="submit" className="send-button" disabled={!input.trim() || loading} aria-label="Send message">
                <FaArrowRight />
              </button>
            </form>
            <p>Bedouin Conversations are stored locally in this browser.</p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default Chatbot;