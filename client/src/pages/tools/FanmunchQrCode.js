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
    // Auto-detect: use localhost for development, production domain for live
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    return isLocalhost ? 'http://localhost:3000' : 'https://www.fanmunch.com';
  });
  const [sectionName, setSectionName] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [sectionsOptions, setSectionsOptions] = useState([]);
  const [loadingSections, setLoadingSections] = useState(false);

  // Array of rows, each with rowNumber, seatStart, seatEnd
  const [rows, setRows] = useState([
    { id: 1, rowNumber: '1', seatStart: '1', seatEnd: '10' }
  ]);

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

  const handleAddRow = () => {
    const newId = Math.max(...rows.map(r => r.id), 0) + 1;
    setRows([...rows, { id: newId, rowNumber: '', seatStart: '1', seatEnd: '10' }]);
  };

  const handleRemoveRow = (id) => {
    if (rows.length > 1) {
      setRows(rows.filter(r => r.id !== id));
    }
  };

  const handleRowChange = (id, field, value) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

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

      const list = [];
      
      // Generate QR codes for each row
      for (const row of rows) {
        if (!row.rowNumber || !`${row.rowNumber}`.trim()) {
          showToast(`Row number is required for all rows.`, 'error', 2500);
          return;
        }
        
        const seatStart = parseInt(row.seatStart, 10);
        const seatEnd = parseInt(row.seatEnd, 10);
        
        if (Number.isNaN(seatStart) || Number.isNaN(seatEnd) || seatStart <= 0 || seatEnd <= 0) {
          showToast(`Invalid seat range for row ${row.rowNumber}`, 'error', 2500);
          return;
        }
        
        if (seatStart > seatEnd) {
          showToast(`Seat start must be less than or equal to seat end for row ${row.rowNumber}`, 'error', 2500);
          return;
        }
        
        // Generate seats for this row
        for (let seatNum = seatStart; seatNum <= seatEnd; seatNum++) {
          const params = new URLSearchParams();
          params.set('row', `${row.rowNumber}`);
          params.set('seat', `${seatNum}`);
          params.set('section', sectionName);
          if (sectionId && sectionId.trim()) params.set('sectionId', sectionId.trim());
          const url = `${baseUrl}?${params.toString()}`;
          list.push({ row: `${row.rowNumber}`, seat: `${seatNum}`, sectionName, sectionId, url });
        }
      }
      
      setLinks(list);
      showToast(`Generated ${list.length} QR codes`, 'success', 2000);
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

  const handleDownloadPDF = () => {
    try {
      // Create a printable HTML page with QR codes in 6x6 grid
      const printWindow = window.open('', '_blank');
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>QR Codes - ${sectionName}</title>
          <style>
            @media print {
              @page { margin: 0.5cm; }
              body { margin: 0; }
            }
            body {
              font-family: Arial, sans-serif;
              padding: 10mm;
              background: white;
            }
            .header {
              text-align: center;
              margin-bottom: 15px;
              page-break-after: avoid;
            }
            .header h1 {
              margin: 0 0 5px 0;
              font-size: 24px;
            }
            .header p {
              margin: 0;
              color: #666;
              font-size: 14px;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15mm;
              page-break-inside: avoid;
            }
            .qr-item {
              border: 2px solid #ddd;
              border-radius: 12px;
              padding: 15px;
              text-align: center;
              background: white;
              page-break-inside: avoid;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .qr-item img {
              width: 100%;
              max-width: 140mm;
              height: auto;
              border-radius: 8px;
              border: 1px solid #eee;
            }
            .qr-label {
              margin-top: 10px;
              font-size: 14px;
              line-height: 1.4;
              font-weight: bold;
              color: #111;
            }
            .print-button {
              position: fixed;
              top: 20px;
              right: 20px;
              padding: 12px 24px;
              background: #3b82f6;
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            }
            .print-button:hover {
              background: #2563eb;
            }
            @media print {
              .print-button { display: none; }
            }
          </style>
        </head>
        <body>
          <button class="print-button" onclick="window.print()">🖨️ Print</button>
          <div class="header">
            <h1>QR Codes</h1>
            <p>${sectionName} • ${links.length} codes</p>
          </div>
          <div class="grid">
            ${links.map(l => `
              <div class="qr-item">
                <img src="${buildQrImgUrl(l.url)}" alt="QR ${l.row}-${l.seat}" />
                <div class="qr-label">Row ${l.row} • Seat ${l.seat} • ${l.sectionName}</div>
              </div>
            `).join('')}
          </div>
        </body>
        </html>
      `;
      
      printWindow.document.write(html);
      printWindow.document.close();
      showToast('Print preview opened', 'success', 1500);
    } catch (e) {
      showToast('Failed to generate print view', 'error', 2000);
    }
  };

  return (
    <div style={{ maxWidth: 1100, margin: '20px auto', padding: '0 16px', direction: 'ltr' }}>
      <h1 style={{ marginBottom: 6, textAlign: 'left' }}>Fanmunch QR Code Generator</h1>
      <p style={{ color: '#6b7280', marginBottom: 18, textAlign: 'left' }}>
        Generate deep-link URLs and QR codes for multiple rows and seat ranges. Each QR code will prefill the Order Confirmation form with seat information.
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
      </div>

      {/* Rows Configuration */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Rows & Seat Ranges</h3>
          <button 
            onClick={handleAddRow}
            style={{ 
              padding: '8px 16px', 
              background: '#10b981', 
              color: 'white', 
              border: 'none', 
              borderRadius: 8, 
              fontSize: 14, 
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            + Add Row
          </button>
        </div>

        {rows.map((row, index) => (
          <div key={row.id} style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr 1fr auto', 
            gap: 12, 
            marginBottom: 12,
            padding: 12,
            background: '#f9fafb',
            borderRadius: 8,
            border: '1px solid #e5e7eb'
          }}>
            <div>
              <div style={{ ...labelStyle, fontSize: 12 }}>Row Number</div>
              <input 
                style={inputStyle} 
                value={row.rowNumber} 
                onChange={(e) => handleRowChange(row.id, 'rowNumber', e.target.value)} 
                placeholder="1" 
              />
            </div>
            <div>
              <div style={{ ...labelStyle, fontSize: 12 }}>Seat Start</div>
              <input 
                style={inputStyle} 
                value={row.seatStart} 
                onChange={(e) => handleRowChange(row.id, 'seatStart', e.target.value)} 
                placeholder="1" 
                type="number"
                min="1"
              />
            </div>
            <div>
              <div style={{ ...labelStyle, fontSize: 12 }}>Seat End</div>
              <input 
                style={inputStyle} 
                value={row.seatEnd} 
                onChange={(e) => handleRowChange(row.id, 'seatEnd', e.target.value)} 
                placeholder="10" 
                type="number"
                min="1"
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              {rows.length > 1 && (
                <button 
                  onClick={() => handleRemoveRow(row.id)}
                  style={{ 
                    padding: '10px 12px', 
                    background: '#ef4444', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: 8, 
                    fontSize: 14,
                    cursor: 'pointer',
                    height: '42px'
                  }}
                  title="Remove row"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        ))}
        <div style={{ color: '#6b7280', fontSize: 12, marginTop: 6 }}>
          Each row will generate QR codes for seats from Start to End (e.g., Row 1: Seats 1-10 generates 10 QR codes)
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={handleGenerate} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#111827', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>Generate QR Codes</button>
        <button onClick={handleDownloadPDF} disabled={links.length === 0} style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #e5e7eb', background: links.length ? '#10b981' : '#f9fafb', color: links.length ? '#fff' : '#9ca3af', cursor: links.length ? 'pointer' : 'not-allowed', fontWeight: 600 }}>📄 Download Printable PDF</button>
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
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <img src={buildQrImgUrl(l.url)} alt={`QR ${l.row}-${l.seat}`} width={110} height={110} style={{ borderRadius: 8, border: '1px solid #e5e7eb' }} />
                      <div style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#111827' }}>
                        Row {l.row} • Seat {l.seat} • {l.sectionName}
                      </div>
                    </div>
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
