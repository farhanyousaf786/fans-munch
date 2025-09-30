import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from '../../i18n/i18n';
import { showToast } from '../../components/toast/ToastContainer';
import { db } from '../../config/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { stadiumStorage } from '../../utils/storage';

// We intentionally avoid adding new deps. We render QR using a public QR image API.
// If you prefer a local generator later, we can swap to `qrcode.react`.
const buildQrImgUrl = (data) => {
  const encoded = encodeURIComponent(data);
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encoded}`;
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  outline: 'none',
  fontSize: 14,
};

const labelStyle = {
  fontWeight: 600,
  marginBottom: 6,
  fontSize: 14,
};

const field = (children, key) => (
  <div key={key} style={{ marginBottom: 14 }}>{children}</div>
);

export default function FanmunchQrCode() {
  const { t } = useTranslation();

  const [baseUrl, setBaseUrl] = useState(() => {
    // Always default to production domain for QR codes
    return 'https://www.fanmunch.com';
  });
  const [sectionName, setSectionName] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [rowNumber, setRowNumber] = useState('1');
  const [totalSeats, setTotalSeats] = useState('10');
  const [sectionsOptions, setSectionsOptions] = useState([]);
  const [loadingSections, setLoadingSections] = useState(false);

  const [links, setLinks] = useState([]);

  // Load sections from Firebase on component mount
  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      setLoadingSections(true);
      
      // Get selected stadium or use first available stadium
      const selectedStadium = stadiumStorage.getSelectedStadium();
      let stadiumId = selectedStadium?.id;
      
      // If no stadium selected, try to get the first stadium
      if (!stadiumId) {
        const stadSnap = await getDocs(collection(db, 'stadiums'));
        if (!stadSnap.empty) {
          stadiumId = stadSnap.docs[0].id;
          console.log('[QR Generator] Using first stadium:', stadiumId);
        }
      }
      
      if (stadiumId) {
        const secsCol = collection(db, 'stadiums', stadiumId, 'sections');
        const secsSnap = await getDocs(secsCol);
        
        const sections = secsSnap.docs.map(d => {
          const data = d.data() || {};
          const no = typeof data.sectionNo === 'number' ? data.sectionNo : Number(data.sectionNo);
          const display = (typeof no === 'number' && !Number.isNaN(no))
            ? `Section ${no}`
            : (data.sectionName || data.name || d.id);
          return {
            id: d.id,
            name: display,
            no: (typeof no === 'number' && !Number.isNaN(no)) ? no : null
          };
        });
        
        // Sort sections by number
        sections.sort((a, b) => {
          if (a.no != null && b.no != null) return a.no - b.no;
          if (a.no != null) return -1;
          if (b.no != null) return 1;
          return String(a.name).localeCompare(String(b.name));
        });
        
        setSectionsOptions(sections);
        
        // Auto-select first section if none selected
        if (sections.length > 0 && !sectionId) {
          const first = sections[0];
          setSectionId(first.id);
          setSectionName(first.name);
        }
        
        showToast(`Loaded ${sections.length} sections`, 'success', 1500);
      } else {
        showToast('No stadium found. Please select a stadium first.', 'error', 3000);
      }
    } catch (error) {
      console.error('Failed to load sections:', error);
      showToast('Failed to load sections from Firebase', 'error', 3000);
    } finally {
      setLoadingSections(false);
    }
  };

  const handleSectionChange = (selectedSectionId) => {
    setSectionId(selectedSectionId);
    const selectedSection = sectionsOptions.find(s => s.id === selectedSectionId);
    if (selectedSection) {
      setSectionName(selectedSection.name);
    }
  };

  const seats = useMemo(() => {
    const total = parseInt(totalSeats, 10);
    if (Number.isNaN(total) || total <= 0) return [];
    return Array.from({ length: total }, (_, i) => `${i + 1}`);
  }, [totalSeats]);

  const handleGenerate = () => {
    try {
      if (!baseUrl || !baseUrl.startsWith('http')) {
        showToast('Base URL must start with http.', 'error', 2500);
        return;
      }
      if (!sectionId || !sectionName.trim()) {
        showToast('Please select a section.', 'error', 2500);
        return;
      }
      if (!rowNumber || !`${rowNumber}`.trim()) {
        showToast('Row number is required.', 'error', 2500);
        return;
      }
      if (seats.length === 0) {
        showToast('Total seats must be a valid number.', 'error', 2500);
        return;
      }

      const list = seats.map((seatNum) => {
        const params = new URLSearchParams();
        params.set('row', `${rowNumber}`);
        params.set('seat', `${seatNum}`);
        params.set('section', sectionName);
        if (sectionId && sectionId.trim()) params.set('sectionId', sectionId.trim());
        const url = `${baseUrl}?${params.toString()}`;
        return { row: `${rowNumber}`, seat: `${seatNum}`, sectionName, sectionId, url };
      });
      setLinks(list);
      showToast(`Generated ${list.length} links`, 'success', 2000);
    } catch (e) {
      showToast(e?.message || 'Failed to generate links', 'error', 3000);
    }
  };

  const handleCopyAll = async () => {
    try {
      const all = links.map(l => l.url).join('\n');
      await navigator.clipboard.writeText(all);
      showToast('All links copied', 'success', 1500);
    } catch (_) {
      showToast('Copy failed', 'error', 2000);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '20px auto', padding: '0 16px' }}>
      <h1 style={{ marginBottom: 6 }}>Fanmunch QR Code</h1>
      <p style={{ color: '#6b7280', marginBottom: 18 }}>
        Enter Section Name, Row Number, and Total Seats to generate deep-link URLs and QR codes that prefill Order Confirmation.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(260px, 1fr))', gap: 16, marginBottom: 16 }}>
        {field(<>
          <div style={labelStyle}>Base URL</div>
          <input style={inputStyle} value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://www.fanmunch.com" />
          <div style={{ color: '#6b7280', fontSize: 12, marginTop: 6 }}>Production: https://www.fanmunch.com | Development: http://localhost:3000</div>
        </>, 'base')}

        {field(<>
          <div style={labelStyle}>Section</div>
          {loadingSections ? (
            <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', color: '#6b7280' }}>
              Loading sections...
            </div>
          ) : sectionsOptions.length > 0 ? (
            <select 
              style={inputStyle} 
              value={sectionId} 
              onChange={(e) => handleSectionChange(e.target.value)}
            >
              <option value="">Select a section</option>
              {sectionsOptions.map(section => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
          ) : (
            <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#6b7280' }}>
              <span>No sections found</span>
              <button 
                onClick={loadSections}
                style={{ 
                  padding: '4px 8px', 
                  background: '#3b82f6', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: 4, 
                  fontSize: 12, 
                  cursor: 'pointer' 
                }}
              >
                Retry
              </button>
            </div>
          )}
          <div style={{ color: '#6b7280', fontSize: 12, marginTop: 6 }}>Sections are loaded from the selected stadium in Firebase</div>
        </>, 'section')}

        {field(<>
          <div style={labelStyle}>Row Number</div>
          <input style={inputStyle} value={rowNumber} onChange={(e) => setRowNumber(e.target.value)} placeholder="1" />
        </>, 'rowNumber')}

        {field(<>
          <div style={labelStyle}>Total Seats</div>
          <input style={inputStyle} value={totalSeats} onChange={(e) => setTotalSeats(e.target.value)} placeholder="10" />
          <div style={{ color: '#6b7280', fontSize: 12, marginTop: 6 }}>Number of seats to generate (1, 2, 3, ... up to this number)</div>
        </>, 'totalSeats')}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <button onClick={handleGenerate} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#111827', color: '#fff', cursor: 'pointer' }}>Generate</button>
        <button onClick={handleCopyAll} disabled={links.length === 0} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: links.length ? '#f3f4f6' : '#f9fafb', color: '#111827', cursor: links.length ? 'pointer' : 'not-allowed' }}>Copy all links</button>
      </div>

      {links.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '8px 6px' }}>Row</th>
                <th style={{ padding: '8px 6px' }}>Seat</th>
                <th style={{ padding: '8px 6px' }}>Section</th>
                <th style={{ padding: '8px 6px' }}>Link</th>
                <th style={{ padding: '8px 6px' }}>QR</th>
              </tr>
            </thead>
            <tbody>
              {links.map((l) => (
                <tr key={`${l.row}-${l.seat}`} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '10px 6px' }}>{l.row}</td>
                  <td style={{ padding: '10px 6px' }}>{l.seat}</td>
                  <td style={{ padding: '10px 6px' }}>{l.sectionName}{l.sectionId ? ` (${l.sectionId})` : ''}</td>
                  <td style={{ padding: '10px 6px' }}>
                    <a href={l.url} target="_blank" rel="noreferrer" style={{ color: '#2563eb' }}>{l.url}</a>
                  </td>
                  <td style={{ padding: '10px 6px' }}>
                    <img src={buildQrImgUrl(l.url)} alt={`QR ${l.row}-${l.seat}`} width={110} height={110} style={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
