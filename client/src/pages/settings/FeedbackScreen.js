import React, { useState } from 'react';
import './settings.css';

const FeedbackScreen = () => {
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    // TODO: Hook to backend/email
    setSent(true);
  };

  return (
    <div className="screen form-screen">
      <h1>Feedback</h1>
      {sent ? (
        <div className="section-card">
          <p>Thanks for your feedback! We'll review it shortly.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="simple-form">
          <div className="section-card">
            <h2>Share your thoughts</h2>
            <label className="helper" htmlFor="fb-email">Email (optional)</label>
            <input id="fb-email" type="email" placeholder="you@example.com" />
            <label className="helper" htmlFor="fb-category">Category</label>
            <select id="fb-category" defaultValue="general">
              <option value="general">General</option>
              <option value="feature">Feature Request</option>
              <option value="ui">Design / UI</option>
              <option value="performance">Performance</option>
            </select>
            <label className="helper" htmlFor="fb-message">Message</label>
            <textarea id="fb-message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Tell us what you think" rows={6} />
            <button type="submit">Send</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default FeedbackScreen;
