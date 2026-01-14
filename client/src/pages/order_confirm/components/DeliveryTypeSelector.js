import React from 'react';
import './DeliveryTypeSelector.css';
import DeliveryNotesField from './DeliveryNotesField';
import { showToast } from '../../../components/toast/ToastContainer';
import { getCachedRates } from '../../../services/currencyInitService';
import { cartUtils } from '../../../utils/cartUtils';
import SeatForm from './SeatForm';

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
  t,
  cartSubtotal,
  stadiumData = {},
  formData = {},
  errors = {},
  onInputChange = () => {},
  sectionsOptions = []
}) => {
  const MANUAL_ENTRY_KEY = 'manual_delivery_entry';
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

    if (openTime === closeTime) return true;
    
    if (openTime < closeTime) {
      return currentTime >= openTime && currentTime <= closeTime;
    } else {
      // Midnight crossover (e.g. 22:00 - 02:00)
      return currentTime >= openTime || currentTime <= closeTime;
    }
  };

  const insideOpen = hasInsideDelivery && isDeliveryOpen('inside');
  const outsideOfVenueOpen = hasOutsideDelivery && isDeliveryOpen('outside');
  const userSelectedInsideOutside = selectedType === 'inside' || selectedType === 'outside';

  const handleTypeChange = (type) => {
    if (type === 'outside') {
      // Check for $50 minimum order
      const cartItems = cartUtils.getCartItems();
      const cartCurrency = cartItems.length > 0 ? cartItems[0].currency || 'ILS' : 'ILS';
      const rates = getCachedRates() || { 'ILS': 3.7, 'USD': 1 }; // Fallback rates
      
      const cartRate = rates[cartCurrency] || 1;
      const subtotalInUSD = cartSubtotal / cartRate;
      
      console.log(`🌍 [MIN ORDER CHECK] Subtotal: ${cartSubtotal} ${cartCurrency}, Rate: ${cartRate}, In USD: ${subtotalInUSD.toFixed(2)}`);
      
      if (subtotalInUSD < 50) {
        showToast(t?.('order.err_outside_min_order') || 'Outside delivery requires a minimum order of $50.', 'error', 4000);
        return;
      }
    }

    // Show toast if the selected delivery type is closed
    if (type === 'inside' && !insideOpen) {
      showToast(t?.('order.err_delivery_closed') || 'Inside delivery is currently closed.', 'warning', 3000);
    } else if (type === 'outside' && !outsideOfVenueOpen) {
      showToast(t?.('order.err_delivery_closed') || 'Outside delivery is currently closed.', 'warning', 3000);
    }

    onTypeChange(type);
  };

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
            onClick={() => handleTypeChange('inside')}
          >
            {selectedType === 'inside' && (
              <div
                className="clear-selection"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTypeChange(null);
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
              {!insideOpen && (
                <div className="delivery-type-status closed" style={{ fontSize: '10px', marginTop: '4px', opacity: 0.8 }}>
                  {t?.('order.closed') || 'Offline'}
                </div>
              )}
            </div>
          </button>
        )}

        {/* Outside Delivery Option */}
        {hasOutsideDelivery && (
          <button
            type="button"
            className={`delivery-type-option ${selectedType === 'outside' ? 'selected' : ''} ${!outsideOfVenueOpen ? 'closed' : ''}`}
            onClick={() => handleTypeChange('outside')}
          >
            {selectedType === 'outside' && (
              <div
                className="clear-selection"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTypeChange(null);
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
              {!outsideOfVenueOpen && (
                <div className="delivery-type-status closed" style={{ fontSize: '10px', marginTop: '4px', opacity: 0.8 }}>
                  {t?.('order.closed') || 'Offline'}
                </div>
              )}
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
            
            // Allow showing the dropdown if inside delivery to support manual entry
            if (locations.length === 0 && selectedType !== 'inside') return null;
            
            return (
              <div style={{ marginBottom: '20px', marginTop: '20px' }}>
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
                    const locationName = typeof location === 'string' ? location : location.name;
                    const locationValue = typeof location === 'string' ? location : location.name;
                    return (
                      <option key={index} value={locationValue}>
                        {locationName}
                      </option>
                    );
                  })}
                  
                  {/* Append General Delivery Option for Inside Delivery */}
                  {selectedType === 'inside' && (
                    <option value={MANUAL_ENTRY_KEY}>
                      ➕ {t?.('order.manual_location_entry') || 'Add specific room/section details'}
                    </option>
                  )}
                </select>
              </div>
            );
          })()}

          {/* Show SeatForm if manual entry is selected in the dropdown */}
          {selectedType === 'inside' && deliveryLocation === MANUAL_ENTRY_KEY && (
            <div style={{ 
              marginTop: '10px', 
              marginBottom: '20px', 
              padding: '16px', 
              background: '#f8fafc', 
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <SeatForm 
                formData={formData} 
                errors={errors} 
                onChange={onInputChange} 
                sectionsOptions={sectionsOptions}
                showSeats={!!stadiumData.availableSeats}
                showSections={stadiumData.availableSections !== false}
                showFloors={!!stadiumData.availableFloors}
                floorsCount={stadiumData.floors || 0}
                showRooms={!!stadiumData.availableRooms}
                showStands={!!stadiumData.availableStands}
              />
            </div>
          )}

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
