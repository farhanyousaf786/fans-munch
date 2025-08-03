// App Color Palette
// Based on Flutter Color definitions converted to hex

export const Colors = {
  // Background
  bgColor: '#F5F5F5',
  
  // Primary Colors
  primaryColor: '#3D70FF',
  primaryDarkColor: '#3161EA', // 20% darker
  primaryLightColor: '#5A84F8',
  
  // Common Colors
  white: '#FFFFFF',
  black: '#000000',
  
  // Text Colors
  textPrimary: '#333333',
  textSecondary: '#666666',
  textLight: '#999999',
  
  // Status Colors
  success: '#28A745',
  error: '#DC3545',
  warning: '#FFC107',
  info: '#17A2B8',
  
  // Neutral Colors
  gray100: '#F8F9FA',
  gray200: '#E9ECEF',
  gray300: '#DEE2E6',
  gray400: '#CED4DA',
  gray500: '#ADB5BD',
  gray600: '#6C757D',
  gray700: '#495057',
  gray800: '#343A40',
  gray900: '#212529'
};

// Gradient definitions
export const Gradients = {
  primary: `linear-gradient(135deg, ${Colors.primaryColor} 0%, ${Colors.primaryDarkColor} 100%)`,
  primaryLight: `linear-gradient(135deg, ${Colors.primaryLightColor} 0%, ${Colors.primaryColor} 100%)`,
  background: `linear-gradient(135deg, ${Colors.primaryColor} 0%, ${Colors.primaryLightColor} 100%)`
};

// Export individual colors for easy access
export const {
  bgColor,
  primaryColor,
  primaryDarkColor,
  primaryLightColor,
  white,
  black,
  textPrimary,
  textSecondary,
  textLight
} = Colors;

export default Colors;
