import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingBottom: 24,
    zIndex: 10,
  },
  titleStyle: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    color: '#fff',
  },
  betRow: {
    paddingHorizontal: 16,
    marginVertical: 14,
    gap: 12,
  },
  betChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  betChipActive: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255, 0.08)',
    marginHorizontal: 6,
  },
  stepperInput: {
    width: 64,
    height: 34,
    borderRadius: 8,
    paddingHorizontal: 10,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255, 0.08)',
    textAlign: 'center',
    marginHorizontal: 2,
  },
  tipText: {
    fontSize: 12,
    color: 'rgba(255,255,255, 0.65)',
  },
  betChipText: {
    fontSize: 14,
    color: '#111827',
  },
  betChipTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  inputWrapper: {
    paddingHorizontal: 16,
  },
  input: {
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
  },
  counterText: {
    marginTop: 6,
    fontSize: 12,
    color: 'rgba(255,255,255, 0.55)',
    textAlign: 'right',
  },
});
