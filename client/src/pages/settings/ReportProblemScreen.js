import React, { useState } from 'react';
import './settings.css';

const ReportProblemScreen = () => {
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    // TODO: Hook to bug reporting backend
    setSent(true);
  };

  return (
    <div className="screen form-screen">
      <h1>Report a Problem</h1>
      {sent ? (
        <div className="section-card">
          <p>Thanks, we received your report. Our team will investigate.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="simple-form">
          <div className="section-card">
            <h2>What went wrong?</h2>
            <label className="helper" htmlFor="rp-steps">Steps to reproduce (optional)</label>
            <textarea id="rp-steps" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe the issue" rows={6} />
            <button type="submit">Submit</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ReportProblemScreen;
