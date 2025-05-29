import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { PageProps } from './type';
import { useTheme } from '@react-navigation/native';
import { Card, Flex, Space } from '@fruits-chain/react-native-xiaoshu';

const App = (props: PageProps) => {
  const { colors, dark } = useTheme();

  const styles = StyleSheet.create({
    cardTitle: {
      padding: 14,
      borderBottomColor: colors.border,
      borderBottomWidth: 0.5,
    },
    title: {
      color: colors.text,
      fontSize: 15,
      fontWeight: 'bold',
      marginBottom: 3,
    },
    desc: {
      color: '#888',
      fontSize: 12,
    },
    appWrap: {
      width: '20%',
      marginBottom: 16,
    },
  });

  return (
    <Card bodyPadding={0} style={{ backgroundColor: colors.card }}>
      <Flex justify="between" style={styles.cardTitle}>
        <View>
          <Text style={styles.title}>{props.title}</Text>
          <Text style={styles.desc}>{props.desc}</Text>
        </View>
        {props.action}
      </Flex>
      <View style={{ padding: 14 }}>{props.children}</View>
    </Card>
  );
};

export default App;
