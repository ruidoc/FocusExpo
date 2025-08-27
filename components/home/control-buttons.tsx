import Icon from '@expo/vector-icons/Ionicons';
import React from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View,
} from 'react-native';

interface ControlButtonsProps {
  onPause: () => void;
  onStop: () => void;
}

const ControlButtons: React.FC<ControlButtonsProps> = ({ onPause, onStop }) => {
  return (
    <View style={styles.container}>
      {/* 暂停按钮 */}
      <TouchableOpacity style={styles.button} onPress={onPause}>
        <Icon name="pause" size={24} color="#B3B3BA" />
      </TouchableOpacity>
      
      {/* 停止按钮 */}
      <TouchableOpacity style={styles.button} onPress={onStop}>
        <Icon name="stop" size={24} color="#B3B3BA" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
  },
  button: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#85869930',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ControlButtons;
