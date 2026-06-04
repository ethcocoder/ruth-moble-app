import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Platform } from "react-native";
import { useColors } from "@/hooks/use-colors";
import { useAuthContext } from "@/lib/auth-context";

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 20 : Math.max(insets.bottom, 12);
  const tabBarHeight = 70 + bottomPadding;
  const { userRole, userStatus } = useAuthContext();
  const isAdmin = userRole === 'admin' && userStatus === 'approved';
  const isStaff = userRole === 'staff' && userStatus === 'approved';

  const renderHapticTab = (props: any) => <HapticTab {...props} />;
  const renderHiddenTab = (_props: any) => null;

  return (
    <Tabs
      screenOptions={({ route }) => {
        const commonOptions = {
          tabBarActiveTintColor: colors.tint,
          tabBarInactiveTintColor: colors.muted,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginBottom: 4,
          },
          headerShown: false,
          tabBarStyle: {
            paddingTop: 10,
            paddingBottom: bottomPadding,
            height: tabBarHeight,
            backgroundColor: colors.surface,
            borderTopColor: 'transparent',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -1 },
            shadowOpacity: 0.12,
            shadowRadius: 14,
            elevation: 16,
          },
        };

        const hiddenOptions = {
          ...commonOptions,
          tabBarButton: renderHiddenTab,
          tabBarItemStyle: { display: 'none' },
          tabBarLabel: '',
        };

        const tabIcons: Record<string, (props: { color: string }) => JSX.Element> = {
          'staff-dashboard': ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
          'staff-products': ({ color }) => <IconSymbol size={24} name="inventory_2" color={color} />,
          'staff-sales': ({ color }) => <IconSymbol size={24} name="shopping_cart" color={color} />,
          'admin-dashboard': ({ color }) => <IconSymbol size={24} name="bar_chart" color={color} />,
          profile: ({ color }) => <IconSymbol size={24} name="person" color={color} />,
        };

        if (route.name === 'profile') {
          return userStatus === 'approved'
            ? {
                ...commonOptions,
                title: 'Profile',
                tabBarIcon: tabIcons.profile,
                tabBarButton: renderHapticTab,
              }
            : hiddenOptions;
        }

        if (route.name === 'admin-dashboard') {
          return isAdmin
            ? {
                ...commonOptions,
                title: 'Analytics',
                tabBarIcon: tabIcons['admin-dashboard'],
                tabBarButton: renderHapticTab,
              }
            : hiddenOptions;
        }

        if (['staff-dashboard', 'staff-products', 'staff-sales'].includes(route.name)) {
          return isStaff
            ? {
                ...commonOptions,
                title:
                  route.name === 'staff-dashboard'
                    ? 'Dashboard'
                    : route.name === 'staff-products'
                    ? 'Products'
                    : 'Sales',
                tabBarIcon: tabIcons[route.name],
                tabBarButton: renderHapticTab,
              }
            : hiddenOptions;
        }

        return hiddenOptions;
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="home" />
      <Tabs.Screen name="products" />
      <Tabs.Screen name="staff-dashboard" />
      <Tabs.Screen name="staff-products" />
      <Tabs.Screen name="staff-sales" />
      <Tabs.Screen name="admin-dashboard" />
      <Tabs.Screen name="admin-users" />
      <Tabs.Screen name="admin-products" />
      <Tabs.Screen name="admin-reports" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
