import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

// Define all valid icon names
const MATERIAL_ICONS = [
  'home',
  'inventory',
  'shopping_cart',
  'bar_chart',
  'person',
  'people',
  'schedule',
  'send',
  'code',
  'chevron_right',
  'add',
  'attach_money',
  'description',
  'question_mark',
  'notifications',
] as const;

export type IconName = (typeof MATERIAL_ICONS)[number];

/**
 * Simple icon component using Material Icons for all platforms
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
}) {
  // Validate the icon name
  const validName = MATERIAL_ICONS.includes(name as any) ? name : "question_mark";
  return <MaterialIcons color={color} size={size} name={validName} style={style} />;
}
