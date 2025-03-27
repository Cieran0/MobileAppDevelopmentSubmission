import React, { useState, useRef, useEffect } from 'react';
import { View, Button, Alert, SafeAreaView, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera'; 
import { buttons, colors, layout, typography } from '../shared/theme';
import VideoTrim from '../components/VideoTrim';
import AnnotationSelector from '../components/AnnotationSelector';
import { uploadVideo, uploadMetadata } from '../services/uploadService';
import PrimaryButton from '../components/PrimaryButton';

export default function FormChecker() {
  const [step, setStep] = useState(0);
  const [exercise, setExercise] = useState<string | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [trimData, setTrimData] = useState<{
    startTime: number;
    endTime: number;
    videoDuration: number;
    frames: any[];
    startFrameUri: string | null;
  } | null>(null);
  const [finalVideoUri, setFinalVideoUri] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [feedback, setFeedback] = useState<any[]>([]);
  const videoRef = useRef<Video>(null);

  
  useEffect(() => {
    const requestCameraPermission = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to record videos.'
        );
      }
    };

    requestCameraPermission();
  }, []);

  
  const generateFeedback = (averages: number[]) => {
    const feedback: { phase: string; message: string; }[] = [];
    const phases = [
      "Start of Descent",
      "Middle of Descent",
      "End of Descent",
      "Start of Ascent",
      "Middle of Ascent",
      "End of Ascent"
    ];

    averages.forEach((value: number, index: number) => {
      let message = "";
      if (Math.abs(value) < 3) {
        message = `Bar in good position during ${phases[index]}. `;
      }
      else if (value > 0) {
        message = `Bar is too far forward during ${phases[index]}. `;
      } else if (value < 0) {
        message = `Bar is too far back during ${phases[index]}. `;
      }

      feedback.push({
        phase: phases[index],
        message: message
      });
    });

    return feedback;
  };

  
  useEffect(() => {
    const fetchStatus = async () => {
      if (finalVideoUri && videoRef.current) {
        try {
          const status = await videoRef.current.getStatusAsync();
          if (status.isLoaded && status.naturalSize) {
            const { width, height } = status.naturalSize;
            setVideoAspectRatio(width / height);
          }
        } catch (error) {
          console.log('Failed to get video status:', error);
        }
      }
    };

    fetchStatus();
  }, [finalVideoUri]);

  
  const renderExerciseSelection = () => (
    <View style={styles.centered}>
      <Text style={styles.headerText}>Select Exercise</Text>
      <PrimaryButton
        onPress={() => {
          setExercise('bench');
          setStep(1);
        }}
      >
        Bench Press
      </PrimaryButton>
    </View>
  );

  
  const pickOrRecordVideo = async () => {
    const actionOptions = [
      { label: 'Pick from Library', value: 'library' },
      { label: 'Record Video', value: 'camera' },
    ];

    const action = await new Promise((resolve) => {
      Alert.alert(
        'Choose an Option',
        'Would you like to pick a video from your library or record a new one?',
        actionOptions.map((option) => ({
          text: option.label,
          onPress: () => resolve(option.value),
        })),
        { cancelable: true, onDismiss: () => resolve(null) }
      );
    });

    if (!action) return;

    let result;
    if (action === 'library') {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
      });
    } else if (action === 'camera') {
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        videoMaxDuration: 60, 
        allowsEditing: false,
      });
    }

    if (result == undefined) {
      return;
    }

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setVideoUri(result.assets[0].uri);
      setStep(2);
    } else {
      Alert.alert('Error', 'Failed to pick or record video.');
    }
  };

  
  const handleTrimConfirmed = (startFrameUri: string, trimInfo: any) => {
    setTrimData({ ...trimInfo, startFrameUri });
    setStep(3);
  };

  
  const handleAnnotationConfirmed = async (selectedRect: any) => {
    console.log(selectedRect);

    if (!videoUri || !trimData) return;

    try {
      setIsVideoLoading(true); 

      const videoUrl = await uploadVideo(videoUri);
      if (videoUrl) {
        const metadata = {
          exercise,
          start_time: trimData.startTime,
          end_time: trimData.endTime,
          barbell_area: selectedRect,
          video_url: videoUrl,
        };

        
        const { videoUri: processedVideoUri, averages } = await uploadMetadata(metadata);
        console.log('Averages: ', averages);

        if (processedVideoUri) {
          setFinalVideoUri(processedVideoUri);
          setFeedback(generateFeedback(averages)); 
          setStep(4);
        } else {
          Alert.alert('Error', 'No video returned from backend');
        }
      }
    } catch (error) {
      console.log(error);
      Alert.alert('Error', 'Failed to send data');
    } finally {
      setIsVideoLoading(false); 
    }
  };

  const renderContent = () => {
    switch (step) {
      case 0:
        return renderExerciseSelection();
      case 1:
        return (
          <View style={styles.centered}>
            <PrimaryButton
              onPress={pickOrRecordVideo}
              buttonStyle={[buttons.fullWidth, styles.startOver]}
              variant='secondary'
            >
              Pick/Record a Video
              </PrimaryButton>
          </View>
        );
      case 2:
        return videoUri ? (
          <VideoTrim videoUri={videoUri} onTrimConfirmed={handleTrimConfirmed} />
        ) : null;
      case 3:
        return trimData && trimData.startFrameUri ? (
          <AnnotationSelector
            imageUri={trimData.startFrameUri}
            onConfirm={handleAnnotationConfirmed}
            isLoading={isVideoLoading}
          />

        ) : null;
      case 4:
        return finalVideoUri ? (
          <View>
            <Text style={[typography.title, styles.heading]}>
              Bar Path Analysis
            </Text>
            <View style={styles.videoContainer}>
              <Video
                ref={videoRef}
                source={{ uri: finalVideoUri }}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
                isLooping={false}
                style={[styles.video]}
                onLoadStart={() => setIsVideoLoading(true)}
                onLoad={() => setIsVideoLoading(false)}
                onPlaybackStatusUpdate={(status) => {
                  if (status.didJustFinish) {
                    videoRef.current?.setStatusAsync({ shouldPlay: false });
                  }
                }}
              />
            </View>

            <View style={[styles.container]}>
              <Text style={[typography.subtitle, styles.subheading]}>Feedback</Text>
              {feedback.map((item, index) => (
                <View key={index} style={styles.feedbackItem}>
                  <Text style={styles.phaseText}>{item.phase}</Text>
                  <Text style={styles.feedbackText}>{item.message}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.centered}>
            <Text style={{ color: colors.text }}>Processing...</Text>
          </View>
        );
      default:
        return null;
    }
  };

  const renderStartOverButton = () => {
    if (step != 0)
      return (
        <PrimaryButton
          onPress={() => {
            setStep(0);
            setExercise(null);
            setVideoUri(null);
            setTrimData(null);
            setFinalVideoUri(null);
            setFeedback([]);
          }}
          buttonStyle={[buttons.fullWidth, styles.startOver]}
        >
          Start Over
        </PrimaryButton>
      );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {renderContent()}
      {renderStartOverButton()}
    </SafeAreaView>
  );
}


interface LoadingOverlayProps {
  visible: boolean;
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <View style={overlayStyles.overlay}>
      <ActivityIndicator size="large" color="#00FF88" />
    </View>
  );
};


const overlayStyles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(17,17,17,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});


const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  videoContainer: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    position: 'relative',
    borderWidth: 3,
    borderRadius: 20,
    borderColor: colors.border,
    width: '50%',
  },
  video: {
    width: '100%',
    aspectRatio: 1,
  },
  heading: {
    textAlign: 'center',
    marginBottom: '10%',
  },
  startOver: {
    marginTop: '10%',
    width: '75%',
    alignSelf: 'center',
  },
  container: {
    backgroundColor: colors.cardBackground,
    width: '80%',
    alignSelf: 'center',
    marginTop: '10%',
    borderWidth: 3,
    borderRadius: 20,
    borderColor: colors.border,
    padding: 15, 
  },
  subheading: {
    fontSize: 24,
    fontWeight: 'bold', 
    marginBottom: 10, 
  },
  feedbackItem: {
    marginBottom: 10, 
  },
  phaseText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  feedbackText: {
    fontSize: 14,
    color: colors.text,
  },
});
