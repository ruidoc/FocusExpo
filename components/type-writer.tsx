import React, { useEffect, useState } from 'react';
import { Text, View, StyleProp, TextStyle, ViewStyle } from 'react-native';

interface TypewriterProps {
  lines: string[]; // 多行文本
  lineStyle?: StyleProp<TextStyle>; // 每行样式
  containerStyle?: StyleProp<ViewStyle>;
  speed?: number; // 每个字的速度(ms)
  lineDelay?: number; // 行间停顿(ms)
  firstDelay?: number; // 首字延迟(ms)
  onFinish?: () => void; // 全部打完回调
}

const Typewriter: React.FC<TypewriterProps> = ({
  lines,
  lineStyle,
  containerStyle,
  speed = 36,
  lineDelay = 400,
  firstDelay = 700,
  onFinish,
}) => {
  const [displayedLines, setDisplayedLines] = useState<string[]>(
    lines.map(() => ''),
  );
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);

  useEffect(() => {
    if (currentLine < lines.length) {
      if (currentChar < lines[currentLine].length) {
        const timeout = setTimeout(
          () => {
            setDisplayedLines(prev => {
              const newLines = [...prev];
              newLines[currentLine] = lines[currentLine].slice(
                0,
                currentChar + 1,
              );
              return newLines;
            });
            setCurrentChar(c => c + 1);
          },
          currentLine === 0 && currentChar === 0 ? firstDelay : speed,
        );
        return () => clearTimeout(timeout);
      } else {
        // 当前行打完，延迟后进入下一行
        if (currentLine < lines.length - 1) {
          const nextLineTimeout = setTimeout(() => {
            setCurrentLine(l => l + 1);
            setCurrentChar(0);
          }, lineDelay);
          return () => clearTimeout(nextLineTimeout);
        } else {
          // 全部打完
          if (onFinish) {
            setTimeout(() => {
              onFinish();
            }, lineDelay);
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentChar, currentLine, lines]);

  return (
    <View style={containerStyle}>
      {displayedLines.map((line, idx) => (
        <Text key={idx} style={lineStyle}>
          {line}
        </Text>
      ))}
    </View>
  );
};

export default Typewriter;
