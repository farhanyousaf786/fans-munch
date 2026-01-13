import React from 'react';
import './DeliveryTypeSelector.css';
import DeliveryNotesField from './DeliveryNotesField';

/**
 * Component to select between inside and outside delivery options
 * Shows only if shop has inside/outside delivery enabled
 */
const DeliveryTypeSelector = ({ 
  shopData, 
  selectedType, 
  onTypeChange,
  deliveryNotes,
  onNotesChange,
  notesError,
  deliveryLocation,
  onLocationChange,
  t 
}) => {
  // Check if shop has inside or outside delivery enabled
  const hasInsideDelivery = shopData?.insideDelivery?.enabled;
  const hasOutsideDelivery = shopData?.outsideDelivery?.enabled;

  // Don't show if neither is enabled
  if (!hasInsideDelivery && !hasOutsideDelivery) {
    return null;
  }

  // Check if delivery type is currently open
  const isDeliveryOpen = (deliveryType) => {
    const delivery = deliveryType === 'inside' ? shopData.insideDelivery : shopData.outsideDelivery;
    if (!delivery?.enabled) return false;

    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const openTime = delivery.openTime || '00:00';
    const closeTime = delivery.closeTime || '23:59';

    return currentTime >= openTime && currentTime <= closeTime;
  };

  const insideOpen = hasInsideDelivery && isDeliveryOpen('inside');
  const outsideOfVenueOpen = hasOutsideDelivery && isDeliveryOpen('outside');
  const userSelectedInsideOutside = selectedType === 'inside' || selectedType === 'outside';

  return (
    <div className="delivery-type-selector">
      <h3 className="delivery-type-title">
        {t?.('order.delivery_type') || 'Delivery Type'}
      </h3>
      
      <div className="delivery-type-options">
        {/* Inside Delivery Option */}
        {hasInsideDelivery && (
          <button
            type="button"
            className={`delivery-type-option ${selectedType === 'inside' ? 'selected' : ''} ${!insideOpen ? 'closed' : ''}`}
            onClick={() => insideOpen && onTypeChange('inside')}
            disabled={!insideOpen}
          >
            {selectedType === 'inside' && (
              <div
                className="clear-selection"
                onClick={(e) => {
                  e.stopPropagation();
                  onTypeChange(null);
                }}
                aria-label="Clear selection"
              >
                ✕
              </div>
            )}
            <div className="delivery-type-content">
              <div className="delivery-type-name">
                {t?.('order.inside_delivery') || 'Inside Venue Delivery'}
              </div>
              <div className="delivery-type-fee">
                {shopData.insideDelivery.fee} {shopData.insideDelivery.currency}
              </div>
            </div>
          </button>
        )}

        {/* Outside Delivery Option */}
        {hasOutsideDelivery && (
          <button
            type="button"
            className={`delivery-type-option ${selectedType === 'outside' ? 'selected' : ''} ${!outsideOfVenueOpen ? 'closed' : ''}`}
            onClick={() => outsideOfVenueOpen && onTypeChange('outside')}
            disabled={!outsideOfVenueOpen}
          >
            {selectedType === 'outside' && (
              <div
                className="clear-selection"
                onClick={(e) => {
                  e.stopPropagation();
                  onTypeChange(null);
                }}
                aria-label="Clear selection"
              >
                ✕
              </div>
            )}
            <div className="delivery-type-content">
              <div className="delivery-type-name">
                {t?.('order.outside_delivery') || 'Outside Delivery'}
              </div>
              <div className="delivery-type-fee">
                {shopData.outsideDelivery.fee} {shopData.outsideDelivery.currency}
              </div>
            </div>
          </button>
        )}
      </div>

      {/* Show location dropdown, alternative button, and delivery notes when a type is selected */}
      {userSelectedInsideOutside && (
        <>
          {/* Location Dropdown */}
          {(() => {
            const locations = selectedType === 'inside' 
              ? shopData.insideDelivery?.locations || []
              : shopData.outsideDelivery?.locations || [];
            
            if (locations.length === 0) return null;
            
            return (
              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: '600',
                  fontSize: '14px',
                  color: '#374151'
                }}>
                  {t?.('order.select_location') || 'Select Location'}
                </label>
                <select
                  value={deliveryLocation || ''}
                  onChange={(e) => onLocationChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    background: '#ffffff'
                  }}
                >
                  <option value="">-- Choose a location --</option>
                  {locations.map((location, index) => {
                    // Handle both string and object formats
                    const locationName = typeof location === 'string' ? location : location.name;
                    const locationValue = typeof location === 'string' ? location : location.name;
                    
                    return (
                      <option key={index} value={locationValue}>
                        {locationName}
                      </option>
                    );
                  })}
                </select>
              </div>
            );
          })()}

          {/* Alternative option to use traditional delivery */}
          <div style={{
            textAlign: 'center',
            padding: '12px',
            marginBottom: '20px',
            background: '#f8fafc',
            borderRadius: '8px',
            border: '1px dashed #cbd5e1'
          }}>
            <button
              type="button"
              onClick={() => onTypeChange(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#3b82f6',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Or add room/section details instead →
            </button>
          </div>

          <DeliveryNotesField
            value={deliveryNotes}
            onChange={onNotesChange}
            error={notesError}
            t={t}
          />
        </>
      )}
    </div>
  );
};

export default DeliveryTypeSelector;


