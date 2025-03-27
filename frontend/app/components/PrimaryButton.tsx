import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { buttons, colors } from '../shared/theme';

interface Props {
  onPress: () => void;
  children: string;
  variant?: 'primary' | 'secondary' | 'cancel';
  buttonStyle?: any; 
  textStyle?: any; 
}

export default function PrimaryButton({ 
  onPress, 
  children,
  variant = 'primary',
  buttonStyle,
  textStyle
}: Props) {
  const getButtonStyle = () => {
    if (variant === 'primary') return buttons.primary;
    if (variant === 'secondary') return buttons.secondary;
    if (variant === 'cancel') return buttons.secondary;
    return buttonStyle;
  };

  const getTextColor = () => {
    if (variant === 'primary') return '#0A0A0A';
    if (variant === 'secondary') return colors.primary;
    return '#FFF';
  };

  return (
    <TouchableOpacity 
      style={[getButtonStyle(), buttonStyle]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.text, textStyle, { color: getTextColor() }]}>
        {children}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  }
});