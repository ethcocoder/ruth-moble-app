import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import React from "react";
import { View, Text } from "react-native";
import { useTranslation } from "react-i18next";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol, type IconName } from "@/components/ui/icon-symbol";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useAuthContext } from "@/lib/auth-context";
import { useNotificationContext } from "@/lib/notification-context";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 12);
  const tabBarHeight = Platform.OS === "web" ? 80 : 75 + bottomPadding;
  const { userRole, userStatus } = useAuthContext();
  const { unreadCount } = useNotificationContext();
  const { t } = useTranslation();
  const isAdmin = userRole === 'admin' && userStatus === 'approved';
  const isStaff = userRole === 'staff' && userStatus === 'approved';

  const renderHapticTab = (props: any) => <HapticTab {...props} />;
  const renderHiddenTab = (_props: any) => null;

  const tabIcons: Record<string, IconName> = {
    'staff-dashboard': 'home',
    'staff-products': 'inventory',
    'staff-sales': 'shopping_cart',
    'staff-sales-history': 'schedule',
    notifications: 'notifications',
    'admin-dashboard': 'bar_chart',
    'admin-users': 'people',
    'admin-products': 'inventory',
    'admin-daily-sales': 'shopping_cart',
    'admin-employees': 'person',
    'admin-finance': 'attach_money',
    'admin-reports': 'description',
    profile: 'person',
  };

  return (
    <Tabs
      screenOptions={({ route }) => {
        const commonOptions = {
          tabBarActiveTintColor: colors.tint,
          tabBarInactiveTintColor: colors.muted,
          tabBarLabelStyle: {
            fontSize: Platform.OS === "web" ? 11 : 12,
            fontWeight: '600',
            marginTop: 4,
          },
          tabBarIconStyle: {
            marginBottom: 0,
          },
          tabBarItemStyle: {
            flex: 1,
            paddingVertical: 10,
            paddingHorizontal: 8,
          },
          headerShown: false,
          tabBarStyle: {
            paddingTop: Platform.OS === "web" ? 10 : 12,
            paddingBottom: bottomPadding,
            paddingHorizontal: Platform.OS === "web" ? 16 : 12,
            height: tabBarHeight,
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 12,
          },
        };

        // 1. Check for hidden tabs first
        if (['index', 'home', 'products'].includes(route.name)) {
          return {
            ...commonOptions,
            tabBarButton: renderHiddenTab,
            tabBarLabel: '',
            tabBarIcon: () => null,
          };
        }

        // 2. Check for staff specific tabs
        if (['staff-dashboard', 'staff-products', 'staff-sales', 'staff-sales-history'].includes(route.name)) {
          return isStaff
            ? {
                ...commonOptions,
                title:
                  route.name === 'staff-dashboard'
                    ? t('tab.dashboard')
                    : route.name === 'staff-products'
                    ? t('tab.products')
                    : route.name === 'staff-sales'
                    ? t('tab.sales')
                    : t('tab.history'),
                tabBarIcon: ({ color }) => <IconSymbol size={24} name={tabIcons[route.name]} color={color} />,
                tabBarButton: renderHapticTab,
              }
            : {
                ...commonOptions,
                tabBarButton: renderHiddenTab,
                tabBarLabel: '',
                tabBarIcon: () => null,
              };
        }

        // 3. Check for admin specific tabs
        if (['admin-dashboard', 'admin-users', 'admin-products', 'admin-daily-sales', 'admin-employees', 'admin-finance', 'admin-reports'].includes(route.name)) {
          return isAdmin
            ? {
                ...commonOptions,
                title:
                  route.name === 'admin-dashboard'
                    ? t('tab.dashboard')
                    : route.name === 'admin-users'
                    ? t('tab.employees')
                    : route.name === 'admin-products'
                    ? t('tab.products')
                    : route.name === 'admin-daily-sales'
                    ? t('tab.sales')
                    : route.name === 'admin-employees'
                    ? t('tab.employees')
                    : route.name === 'admin-finance'
                    ? t('tab.finance')
                    : t('tab.reports'),
                tabBarIcon: ({ color }) => <IconSymbol size={24} name={tabIcons[route.name]} color={color} />,
                tabBarButton: renderHapticTab,
              }
            : {
                ...commonOptions,
                tabBarButton: renderHiddenTab,
                tabBarLabel: '',
                tabBarIcon: () => null,
              };
        }

        // 4. Check for notifications tab
        if (route.name === 'notifications') {
          return userStatus === 'approved'
            ? {
                ...commonOptions,
                title: t('tab.notifications'),
                tabBarIcon: ({ color }) => (
                  <View className="relative">
                    <IconSymbol size={24} name={tabIcons.notifications} color={color} />
                    {unreadCount > 0 && (
                      <View className="absolute -top-2 -right-2 bg-red-500 rounded-full min-w-[20px] h-[20px] items-center justify-center">
                        <Text className="text-white text-[10px] font-bold">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                ),
                tabBarButton: renderHapticTab,
              }
            : {
                ...commonOptions,
                tabBarButton: renderHiddenTab,
                tabBarLabel: '',
                tabBarIcon: () => null,
              };
        }

        // 5. Check for profile tab
        if (route.name === 'profile') {
          return userStatus === 'approved'
            ? {
                ...commonOptions,
                title: t('tab.profile'),
                tabBarIcon: ({ color }) => <IconSymbol size={24} name={tabIcons.profile} color={color} />,
                tabBarButton: renderHapticTab,
              }
            : {
                ...commonOptions,
                tabBarButton: renderHiddenTab,
                tabBarLabel: '',
                tabBarIcon: () => null,
              };
        }

        // Default to hidden
        return {
          ...commonOptions,
          tabBarButton: renderHiddenTab,
          tabBarLabel: '',
          tabBarIcon: () => null,
        };
      }}
    >
      <Tabs.Screen name="staff-dashboard" />
      <Tabs.Screen name="staff-products" />
      <Tabs.Screen name="staff-sales" />
      <Tabs.Screen name="staff-sales-history" />
      <Tabs.Screen name="notifications" />
      <Tabs.Screen name="admin-dashboard" />
      <Tabs.Screen name="admin-users" />
      <Tabs.Screen name="admin-products" />
      <Tabs.Screen name="admin-daily-sales" />
      <Tabs.Screen name="admin-employees" />
      <Tabs.Screen name="admin-finance" />
      <Tabs.Screen name="admin-reports" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
