import React from 'react';
import { View, Dimensions, StyleSheet, Text } from 'react-native';
import Svg, { Rect, Text as SvgText, Line } from 'react-native-svg';
import { colors, typography } from '../shared/theme';

const screenWidth = Dimensions.get('window').width;

interface BarGraphProps {
    barName: string;
    data: {
        labels: string[];
        data: number[];
    };
    width: number;
    height?: number;
    barColor?: string;
    overrideMax?: number;
}


const BarGraph: React.FC<BarGraphProps> = ({
    barName,
    data,
    width,
    height = 200,
    barColor = '#00FF88',
    overrideMax,
}) => {
    const { labels } = data;
    const values = data.data;
    const maxValue = overrideMax !== undefined ? overrideMax : Math.max(...values);
    const numBars = values.length;
    const textColor = colors.text;

    
    const gap = 10;
    const leftMargin = 20; 
    const rightMargin = 10 + gap;
    const availableWidth = (width - leftMargin) - rightMargin;
    const barWidth = (availableWidth - gap * (numBars - 1)) / numBars;

    
    const lines = maxValue > 0
        ? Array.from({ length: Math.ceil(maxValue) }, (_, i) => i + 1)
        : [];

    return (
        <View style={[styles.container, { width, height }]}>
            <Text style={[typography.subtitle, {marginBottom: 10, color: colors.text}]}>
                {barName} 
            </Text>
            <Svg width={width} height={height}>
                {/* Y-axis labels and lines */}
                {lines.map((v, idx) => {
                    const y = height - (v / maxValue) * (height - 30) - 20;
                    return (
                        <React.Fragment key={idx}>
                            <Line
                                x1={leftMargin} 
                                y1={y}
                                x2={width - rightMargin} 
                                y2={y}
                                stroke="#333"
                                strokeWidth="1"
                                strokeDasharray="2"
                            />
                            <SvgText
                                x={leftMargin - 5} 
                                y={y}
                                fontSize="14"
                                fill={textColor}
                                alignmentBaseline="middle"
                                textAnchor="end"
                            >
                                {v}
                            </SvgText>
                        </React.Fragment>
                    );
                })}

                {/* Bars */}
                {values.map((value, index) => {
                    const barHeight = (value / maxValue) * (height - 30);
                    const x = leftMargin + gap + index * (barWidth + gap);
                    const yBar = height - barHeight - 20;

                    return (
                        <React.Fragment key={index}>
                            <Rect
                                x={x}
                                y={yBar}
                                width={barWidth}
                                height={barHeight}
                                fill={barColor}
                                rx={4}
                            />
                            <SvgText
                                x={x + barWidth / 2}
                                y={height - 5}
                                fontSize="12"
                                fill={textColor}
                                textAnchor="middle"
                            >
                                {labels[index]}
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

export default BarGraph;