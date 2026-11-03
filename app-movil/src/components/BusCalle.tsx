import { useEffect, useRef } from "react";
import { Animated, Easing, View, useWindowDimensions } from "react-native";
import Svg, { Circle, Rect, Text as SvgText } from "react-native-svg";
import { C } from "@/theme";

/** Escena animada: un bus recorre la calle y pasa por paradas que laten. */
export default function BusCalle({ alto = 170 }: { alto?: number }) {
  const { width } = useWindowDimensions();
  const x = useRef(new Animated.Value(-260)).current;
  const rebote = useRef(new Animated.Value(0)).current;
  const calle = useRef(new Animated.Value(0)).current;
  const pulso = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anims = [
      Animated.loop(Animated.timing(x, { toValue: width + 20, duration: 11000, easing: Easing.linear, useNativeDriver: true })),
      Animated.loop(
        Animated.sequence([
          Animated.timing(rebote, { toValue: -3, duration: 300, useNativeDriver: true }),
          Animated.timing(rebote, { toValue: 0, duration: 300, useNativeDriver: true }),
        ])
      ),
      Animated.loop(Animated.timing(calle, { toValue: -96, duration: 1200, easing: Easing.linear, useNativeDriver: true })),
      Animated.loop(Animated.timing(pulso, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: true })),
    ];
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [x, rebote, calle, pulso, width]);

  const suelo = alto - 40;
  const paradas = [width * 0.2, width * 0.55, width * 0.85];
  const edificios = [
    [10, 70, 60, "#2a2a2a"],
    [90, 90, 46, "#333"],
    [160, 50, 70, "#2a2a2a"],
    [250, 100, 52, "#333"],
    [320, 66, 64, "#2a2a2a"],
  ] as const;

  return (
    <View style={{ height: alto, overflow: "hidden", backgroundColor: C.bg }}>
      <Svg width={width} height={alto}>
        {edificios.map(([ex, ey, ew, f], i) => (
          <Rect key={i} x={ex} y={suelo - ey * 0.9} width={ew} height={ey * 0.9} fill={f} />
        ))}
      </Svg>

      {paradas.map((px, i) => (
        <View key={i} style={{ position: "absolute", left: px - 22, top: suelo - 62, alignItems: "center" }}>
          <View style={{ backgroundColor: C.yellow, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Animated.Text style={{ fontSize: 11, fontWeight: "800", color: "#111" }}>BUS</Animated.Text>
          </View>
          <View style={{ width: 5, height: 44, backgroundColor: C.yellow }} />
          <Animated.View
            style={{
              position: "absolute",
              bottom: 36,
              width: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: C.yellow,
              opacity: pulso.interpolate({ inputRange: [0, 1], outputRange: [0.9, 0] }),
              transform: [{ scale: pulso.interpolate({ inputRange: [0, 1], outputRange: [0.6, 2.2] }) }],
            }}
          />
        </View>
      ))}

      <View style={{ position: "absolute", left: 0, right: 0, top: suelo, height: 40, backgroundColor: "#0f0f0f" }} />
      <Animated.View style={{ position: "absolute", top: suelo + 22, flexDirection: "row", transform: [{ translateX: calle }] }}>
        {Array.from({ length: Math.ceil(width / 96) + 2 }).map((_, i) => (
          <View key={i} style={{ width: 48, height: 5, borderRadius: 3, backgroundColor: C.yellow, marginRight: 48 }} />
        ))}
      </Animated.View>

      <Animated.View style={{ position: "absolute", top: suelo - 66, transform: [{ translateX: x }, { translateY: rebote }] }}>
        <Svg width={190} height={80} viewBox="0 0 320 130">
          <Rect x="4" y="14" width="312" height="90" rx="22" fill="#ffd500" />
          <Rect x="4" y="72" width="312" height="18" fill="#1f9d55" />
          <Rect x="24" y="26" width="58" height="42" rx="8" fill="#1a2a30" />
          <Rect x="92" y="26" width="58" height="42" rx="8" fill="#1a2a30" />
          <Rect x="160" y="26" width="58" height="42" rx="8" fill="#1a2a30" />
          <Rect x="228" y="26" width="72" height="56" rx="8" fill="#1a2a30" />
          <Rect x="234" y="31" width="60" height="11" rx="4" fill="#fff" />
          <SvgText x="264" y="40" fontSize="9" fontWeight="800" fill="#111" textAnchor="middle">
            MÓNTESE
          </SvgText>
          <Circle cx="306" cy="90" r="5" fill="#fff" />
          <Circle cx="70" cy="106" r="19" fill="#111" />
          <Circle cx="70" cy="106" r="8" fill="#ffd500" />
          <Circle cx="248" cy="106" r="19" fill="#111" />
          <Circle cx="248" cy="106" r="8" fill="#ffd500" />
        </Svg>
      </Animated.View>
    </View>
  );
}
