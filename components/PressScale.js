import React, { useRef } from 'react';
import { Animated, Easing, Pressable } from 'react-native';

export default function PressScale({ onPress, onPressChange, scaleTo = 0.97, disabled, style, hitSlop, children }) {
  const scale = useRef(new Animated.Value(1)).current;

  const animate = (to, duration) => {
    Animated.timing(scale, { toValue: to, duration, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  };

  return (
    <Animated.View style={[style, { transform: [{ scale }] }]}>
      <Pressable
        disabled={disabled}
        hitSlop={hitSlop}
        style={fill}
        onPress={onPress}
        onPressIn={() => {
          onPressChange?.(true);
          animate(scaleTo, 70);
        }}
        onPressOut={() => {
          onPressChange?.(false);
          animate(1, 110);
        }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}

const fill = { flexGrow: 1 };
