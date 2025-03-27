import React, { useState, useEffect, useRef } from 'react';
import { View, Button, StyleSheet, Text, Image, Dimensions, Alert, LayoutChangeEvent } from 'react-native';
import { Video } from 'expo-av';
import * as VideoThumbnails from 'expo-video-thumbnails';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { colors } from '../shared/theme';
import PrimaryButton from './PrimaryButton';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface VideoTrimProps {
  videoUri: string;
  onTrimConfirmed: (startFrameUri: string, trimInfo: any) => void;
}

export default function VideoTrim({ videoUri, onTrimConfirmed }: VideoTrimProps) {
  const [videoDuration, setVideoDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(0);
  const [frames, setFrames] = useState<any[]>([]);
  const [containerWidth, setContainerWidth] = useState(screenWidth);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressPosition, setProgressPosition] = useState(0);
  const [startFrameUri, setStartFrameUri] = useState<string | null>(null);
  const videoRef = useRef<Video>(null);

  
  const handleVideoLoad = async (status: any) => {
    if (status.durationMillis) {
      const duration = status.durationMillis / 1000;
      setVideoDuration(duration);
      setEndTime(duration);
      await generateFrames(duration);
    }
  };

  const generateFrames = async (duration: number) => {
    const frameCount = Math.min(20, Math.round(duration));
    const interval = duration / frameCount;
    const frameArr = [];

    for (let i = 0; i < frameCount; i++) {
      const time = i * interval;
      try {
        const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
          time: Math.round(time * 1000),
          quality: 0.5,
        });
        frameArr.push({ time, uri });
      } catch (error) {
        console.error('Error generating thumbnail:', error);
      }
    }
    setFrames(frameArr);
  };

  
  const handleStartPan = (event: any) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      const touchX = event.nativeEvent.absoluteX;
      const newTime = (touchX / containerWidth) * videoDuration;
      setStartTime(Math.max(0, Math.min(newTime, endTime)));
    }
  };

  const handleEndPan = (event: any) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      const touchX = event.nativeEvent.absoluteX;
      const newTime = (touchX / containerWidth) * videoDuration;
      setEndTime(Math.max(startTime, Math.min(newTime, videoDuration)));
    }
  };

  const handleProgressPan = (event: any) => {
    if (event.nativeEvent.state === State.ACTIVE) {
      const touchX = event.nativeEvent.absoluteX;
      const newPosition = (touchX / containerWidth) * videoDuration;
      setProgressPosition(Math.max(0, Math.min(newPosition, videoDuration)));
      if (videoRef.current) {
        videoRef.current.setPositionAsync(newPosition * 1000);
      }
    }
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  useEffect(() => {
    let interval: any;
    if (videoRef.current) {
      interval = setInterval(async () => {
        if (isPlaying) {
          const status = await videoRef.current?.getStatusAsync();
          if (status?.isLoaded && !status.isBuffering) {
            setProgressPosition(status.positionMillis / 1000);
          }
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleConfirmTrim = async () => {
    try {
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: Math.round(startTime * 1000),
        quality: 0.8,
      });
      setStartFrameUri(uri);
      onTrimConfirmed(uri, { startTime, endTime, videoDuration, frames });
    } catch (error) {
      Alert.alert('Error', 'Failed to generate frame');
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <View style={styles.videoContainer}>
      <Video
        ref={videoRef}
        source={{ uri: videoUri }}
        style={styles.video}
        onLoad={handleVideoLoad}
        shouldPlay={isPlaying}
      />
      <View style={styles.tapArea} onStartShouldSetResponder={() => true} onResponderRelease={() => setIsPlaying(!isPlaying)} />
      <View style={styles.timelineContainer} onLayout={handleLayout}>
        <View style={styles.timeline}>
          {frames.map((frame, index) => (
            <Image
              key={index}
              source={{ uri: frame.uri }}
              style={[styles.frame, { width: containerWidth / frames.length }]}
            />
          ))}
        </View>
        <PanGestureHandler onGestureEvent={handleStartPan}>
          <View style={[styles.handleContainer, { left: (startTime / videoDuration) * containerWidth - 20 }]}>
            <View style={[styles.handle, { backgroundColor: colors.primary }]} />
          </View>
        </PanGestureHandler>
        <PanGestureHandler onGestureEvent={handleEndPan}>
          <View style={[styles.handleContainer, { left: (endTime / videoDuration) * containerWidth - 20 }]}>
            <View style={[styles.handle, { backgroundColor: colors.primary }]} />
          </View>
        </PanGestureHandler>
        <PanGestureHandler onGestureEvent={handleProgressPan}>
          <View style={[styles.handleContainer, { left: (progressPosition / videoDuration) * containerWidth - 20 }]}>
            <View style={[styles.handle, { backgroundColor: 'yellow' }]} />
          </View>
        </PanGestureHandler>
        <View style={styles.timestamps}>
          <Text style={styles.timestamp}>{startTime.toFixed(1)}s</Text>
          <Text style={styles.timestamp}>{endTime.toFixed(1)}s</Text>
        </View>
      </View>
      <PrimaryButton onPress={handleConfirmTrim} buttonStyle={styles.confirmTrimButton}>
        Confirm Trim
      </PrimaryButton>
    </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  videoContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    width: screenWidth,
    height: screenHeight / 2,
  },
  tapArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  timelineContainer: {
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  timeline: {
    flexDirection: 'row',
    height: 60,
  },
  frame: {
    height: '100%',
  },
  handleContainer: {
    position: 'absolute',
    width: 40,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  handle: {
    width: 2,
    height: '100%',
  },
  timestamps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 5,
  },
  timestamp: {
    color: colors.text,
    fontSize: 14,
  },

});
