import React, { useState, useEffect } from 'react';
import { View, Button, StyleSheet, Text, Image, Dimensions } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import { colors } from '../shared/theme';
import LoadingOverlay from './LoadingOverlay';
import PrimaryButton from './PrimaryButton';

interface AnnotationSelectorProps {
  imageUri: string;
  onConfirm: (rectCoords: { x: number; y: number; width: number; height: number } | null) => void;
  isLoading: boolean;
}

export default function AnnotationSelector({ imageUri, onConfirm, isLoading }: AnnotationSelectorProps) {
  const [rectCoords, setRectCoords] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [containerDimensions, setContainerDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [showFullImage, setShowFullImage] = useState(false);

  useEffect(() => {
    Image.getSize(imageUri, (width, height) => {
      setImageSize({ width, height });
    });
  }, [imageUri]);

  const handleContainerLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerDimensions({ width, height });
  };

  const handleTouchStart = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    setTouchStart({ x: locationX, y: locationY });
    setCurrentCoords({ x: locationX, y: locationY, width: 0, height: 0 });
  };

  const handleTouchMove = (event: any) => {
    if (!touchStart) return;
    const { locationX, locationY } = event.nativeEvent;
    const x = Math.min(touchStart.x, locationX);
    const y = Math.min(touchStart.y, locationY);
    const width = Math.abs(locationX - touchStart.x);
    const height = Math.abs(locationY - touchStart.y);
    setCurrentCoords({ x, y, width, height });
  };

  const handleTouchEnd = (event: any) => {
    if (!touchStart) return;
    const { locationX, locationY } = event.nativeEvent;
    const x = Math.min(touchStart.x, locationX);
    const y = Math.min(touchStart.y, locationY);
    const width = Math.abs(locationX - touchStart.x);
    const height = Math.abs(locationY - touchStart.y);
    const finalCoords = { x, y, width, height };
    setRectCoords(finalCoords);
    setCurrentCoords(finalCoords);
    setTouchStart(null);
  };

  const getAbsoluteCoords = () => {
    if (!rectCoords || !containerDimensions.width || !containerDimensions.height || !imageSize) return null;

    const { width: containerW, height: containerH } = containerDimensions;
    const { width: imageW, height: imageH } = imageSize;

    
    const scale = Math.min(containerW / imageW, containerH / imageH);
    const offsetX = (containerW - imageW * scale) / 2;
    const offsetY = (containerH - imageH * scale) / 2;

    
    const x = (rectCoords.x - offsetX) / scale;
    const y = (rectCoords.y - offsetY) / scale;
    const width = rectCoords.width / scale;
    const height = rectCoords.height / scale;

    return { x, y, width, height };
  };

  if (showFullImage && imageSize) {
    const abc = getAbsoluteCoords();

    return (
      <View style={styles.fullImageContainer}>
        <Image
          source={{ uri: imageUri }}
          style={{ width: imageSize.width, height: imageSize.height }}
        />
        <Svg 
          style={
            {
              position: 'absolute',
              top: abc?.y,
              left: abc?.x
            }
          }
        >
              <Rect
                x={0}
                y={0}
                width={abc?.width}
                height={abc?.height}
                fill={`${colors.primary}20`}
                stroke={colors.primary}
                strokeWidth="2"
              />
            </Svg>
          <LoadingOverlay visible={isLoading} />
      </View>
    );
  }

  return (
    <View style={styles.annotationContainer}>
      <Text style={styles.title}>Select Barbell Area</Text>
      <View style={styles.imageContainer} onLayout={handleContainerLayout}>
        <Image 
          source={{ uri: imageUri }} 
          style={[styles.annotationImage, { resizeMode: 'contain' }]} 
        />
        <View
          style={StyleSheet.absoluteFill}
          onStartShouldSetResponder={() => true}
          onResponderGrant={handleTouchStart}
          onResponderMove={handleTouchMove}
          onResponderRelease={handleTouchEnd}
        >
          {(currentCoords || rectCoords) && (
            <Svg height="100%" width="100%" style={styles.annotationSvg}>
              <Rect
                x={(currentCoords || rectCoords)!.x}
                y={(currentCoords || rectCoords)!.y}
                width={(currentCoords || rectCoords)!.width}
                height={(currentCoords || rectCoords)!.height}
                fill={`${colors.primary}20`}
                stroke={colors.primary}
                strokeWidth="2"
              />
            </Svg>
          )}
        </View>
      </View>
      <PrimaryButton 
        onPress={() => {
          onConfirm(getAbsoluteCoords() || rectCoords);
          
        }} 
        buttonStyle={styles.confirmSelection}
      >
        Confirm Selection
        </PrimaryButton>
      <LoadingOverlay visible={isLoading} />
    </View>
  );
}

const styles = StyleSheet.create({
  annotationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  imageContainer: {
    position: 'relative',
    width: '90%',
    height: '80%',
    aspectRatio: 9 / 16,
    borderColor: colors.primary,
  },
  annotationImage: {
    flex: 1,
  },
  annotationSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  fullImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#000',
  },
  confirmSelection: {
    marginTop: 20,
  }
});