import { useEffect } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";

export default function OAuthCallback() {
  const router = useRouter();

  useEffect(() => {
    // In a real app, handle OAuth callback here
    setTimeout(() => {
      router.replace("/(tabs)");
    }, 1000);
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Processing OAuth callback...</Text>
    </View>
  );
}
