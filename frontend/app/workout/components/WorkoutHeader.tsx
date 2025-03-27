import React from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PrimaryButton from '../../components/PrimaryButton';
import { buttons, layout, typography } from '@/app/shared/theme';

interface WorkoutHeaderProps {
  seconds: number;
  handleFinishWorkout: () => void;
}

const WorkoutHeader: React.FC<WorkoutHeaderProps> = ({ 
  seconds, 
  handleFinishWorkout 
}) => {
  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const remainingSeconds = secs % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[layout.header]}>
      <Text style={typography.timer}>{formatTime(seconds)}</Text>
      <PrimaryButton 
        variant="primary"
        onPress={handleFinishWorkout}
        buttonStyle={buttons.finish}
      >
        Finish
      </PrimaryButton>
    </View>
  );
};

export default WorkoutHeader;