import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Svg, { Line, Polyline, Circle, Text as SvgText } from 'react-native-svg';
import { colors, typography } from '../shared/theme';

interface LineGraphProps {
    lineName: string;
    data: {
        labels: string[];
        data: number[];
    };
    width: number;
    height?: number;
}

const LineGraph: React.FC<LineGraphProps> = ({
    lineName,
    data,
    width,
    height = 220,
}) => {
    const { labels } = data;
    const values = data.data;
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const numPoints = values.length;
    const textColor = '#fff'; 

    
    const stepSize = 5;
    
    const baseline = Math.floor(minValue / stepSize) * stepSize;
    
    const gridMax = Math.ceil(maxValue / stepSize) * stepSize;
    const range = gridMax - baseline;

    
    const topPadding = 20;
    const bottomPadding = 40; 
    const leftMargin = 20; 
    const rightMargin = 20;
    const graphStart = leftMargin+20;
    const availableWidth = width - graphStart - rightMargin;
    const interval = numPoints > 1 ? availableWidth / (numPoints - 1) : 0;

    
    const getYPosition = (value: number) => {
        if (range === 0) return height - bottomPadding;
        return topPadding + ((gridMax - value) / range) * (height - topPadding - bottomPadding);
    };

    
    const getGridSteps = () => {
        const steps = [];
        for (let step = baseline ; step <= gridMax; step += stepSize) {
            steps.push(step);
        }
        return steps;
    };

    return (
        <View style={[styles.container, { width, height }]}>
            <Text style={[typography.subtitle, {marginBottom: 0, color: colors.text}]}>
                {lineName}
            </Text>
            <Svg width={width} height={height}>
                {/* Horizontal grid lines */}
                {getGridSteps().map((step, i) => {
                    const y = getYPosition(step);
                    return (
                        <React.Fragment key={i}>
                            <Line
                                x1={leftMargin}
                                y1={y}
                                x2={width - rightMargin}
                                y2={y}
                                stroke="#333"
                                strokeWidth={0.5}
                            />
                            <SvgText
                                x={leftMargin}
                                y={y}
                                fontSize="12"
                                fill={textColor}
                                alignmentBaseline="middle"
                                textAnchor="end"
                            >
                                {step}kg
                            </SvgText>
                        </React.Fragment>
                    );
                })}

                {/* Data line */}
                <Polyline
                    points={values.map((v, i) => {
                        const x = graphStart + i * interval;
                        const y = getYPosition(v);
                        return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke={`rgba(0, 255, 136, ${1})`}
                    strokeWidth={2}
                />

                {/* Data points and X-axis labels */}
                {values.map((v, i) => {
                    const x = graphStart + i * interval;
                    const y = getYPosition(v);
                    return (
                        <React.Fragment key={i}>
                            <Circle
                                cx={x}
                                cy={y}
                                r={4}
                                fill={`rgba(0, 255, 136, ${1})`}
                            />
                            <SvgText
                                x={x}
                                y={height - 5} 
                                fontSize="12"
                                fill={textColor}
                                textAnchor="middle"
                            >
                                {labels[i]}
                            </SvgText>
                        </React.Fragment>
                    );
                })}
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignSelf: 'center',
        marginBottom: 35
    },
});

export default LineGraph;
