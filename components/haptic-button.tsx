import { TouchableOpacity, Text, ViewStyle, TextStyle, ActivityIndicator } from "react-native";
import * as Haptics from "expo-haptics";
import { cn } from "@/lib/utils";

interface HapticButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: "primary" | "secondary" | "danger";
}

export function HapticButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  style,
  textStyle,
  variant = "primary",
}: HapticButtonProps) {
  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const getVariantClasses = () => {
    switch (variant) {
      case "primary":
        return "bg-primary";
      case "secondary":
        return "bg-surface border border-border";
      case "danger":
        return "bg-error/10 border border-error";
      default:
        return "bg-primary";
    }
  };

  const getTextVariantClasses = () => {
    switch (variant) {
      case "primary":
        return "text-background";
      case "secondary":
        return "text-foreground";
      case "danger":
        return "text-error";
      default:
        return "text-background";
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      className={cn(
        "rounded-lg py-3 items-center",
        getVariantClasses(),
        disabled && "opacity-50",
      )}
      style={style}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#ffffff" : "#0a7ea4"}
        />
      ) : (
        <Text
          className={cn("font-semibold", getTextVariantClasses())}
          style={textStyle}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}
