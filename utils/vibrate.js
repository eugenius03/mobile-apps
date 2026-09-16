import { Vibration, Platform } from 'react-native';

export const vibrate = () => {
  try {
    Vibration.vibrate();
    Vibration.vibrate([500, 500, 500]);
  } catch (error) {
    // ignore
  }
};

export const tick = () => {
  try {
    if (Platform.OS === 'android') {
      Vibration.vibrate(10);
    }
  } catch (error) {
    // ignore
  }
};

export default vibrate;

