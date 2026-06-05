import React from "react";
import { View, Text, TouchableOpacity, type ViewProps, type TextProps } from "react-native";
import { cn } from "@/lib/utils";
import { IconSymbol } from "./icon-symbol";

interface HeaderProps extends ViewProps {
  title?: string;
  subtitle?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  className?: string;
}

export function Header({ 
  title,
  subtitle, 
  leftAction, 
  rightAction,
  className,
  ...props
}: HeaderProps) {
  return (
    <View 
      className={cn("px-6 py-5 bg-surface border-b border-border", className)}
      {...props}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          {title && (
            <Text className="text-2xl font-bold text-foreground">
              {title}
            </Text>
          )}
          {subtitle && (
            <Text className="text-muted text-sm mt-1">
              {subtitle}
            </Text>
          )}
        </View>
        
        <View className="flex-row items-center gap-3">
          {leftAction}
          {rightAction}
        </View>
      </View>
    </View>
  );
}

export function HeaderBackButton({ onPress, className }: { onPress: () => void, className?: string }) {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      className={cn("p-2 rounded-full bg-surface2 active:opacity-90", className)}
    >
      <IconSymbol name="chevron_right" size={20} color="var(--color-muted)" />
    </TouchableOpacity>
  );
}

export function HeaderActionButton({ 
  icon,
  onPress,
  variant = "ghost",
  className 
}: { 
  icon: any,
  onPress: () => void,
  variant?: "ghost" | "primary" | "secondary",
  className?: string 
}) {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      className={cn(
        "p-2 rounded-full",
        variant === "primary" ? "bg-primary" : variant === "secondary" ? "bg-surface2 border border-border" : "",
        className
      )}
    >
      <IconSymbol 
        name={icon} 
        size={20} 
        color={variant === "primary" ? "var(--color-background)" : "var(--color-muted)"} 
      />
    </TouchableOpacity>
  );
}