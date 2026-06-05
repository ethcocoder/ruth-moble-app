import React from "react";
import { View, type ViewProps, Text, type TextProps, TouchableOpacity, type TouchableOpacityProps } from "react-native";
import { cn } from "@/lib/utils";

interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  withShadow?: boolean;
}

export function Card({ 
  children, 
  className, 
  hoverable = true, 
  withShadow = true,
  ...props 
}: CardProps) {
  return (
    <View
      className={cn(
        "bg-surface rounded-2xl border border-border overflow-hidden",
        withShadow && "shadow-sm shadow-foreground/5",
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}

export function CardHeader({ 
  children, 
  className,
  ...props
}: ViewProps) {
  return (
    <View
      className={cn("px-6 py-4 border-b border-border", className)}
      {...props}
    >
      {children}
    </View>
  );
}

export function CardTitle({ 
  children, 
  className,
  ...props
}: TextProps) {
  return (
    <Text
      className={cn("text-lg font-semibold text-foreground", className)}
      {...props}
    >
      {children}
    </Text>
  );
}

export function CardDescription({ 
  children, 
  className,
  ...props
}: TextProps) {
  return (
    <Text
      className={cn("text-sm text-muted", className)}
      {...props}
    >
      {children}
    </Text>
  );
}

export function CardContent({ 
  children, 
  className,
  ...props
}: ViewProps) {
  return (
    <View
      className={cn("px-6 py-4", className)}
      {...props}
    >
      {children}
    </View>
  );
}

export function CardFooter({ 
  children, 
  className,
  ...props
}: ViewProps) {
  return (
    <View
      className={cn("px-6 py-4 border-t border-border flex-row items-center", className)}
      {...props}
    >
      {children}
    </View>
  );
}

export function PressableCard({ 
  children, 
  className, 
  onPress,
  activeOpacity = 0.9,
  ...props
}: TouchableOpacityProps) {
  return (
    <TouchableOpacity
      activeOpacity={activeOpacity}
      onPress={onPress}
      className={cn(
        "bg-surface rounded-2xl border border-border overflow-hidden shadow-sm shadow-foreground/5",
        className
      )}
      {...props}
    >
      {children}
    </TouchableOpacity>
  );
}