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
          tabBarIcon: () => null,
        };

        const tabIcons: Record<string, (props: { color: string }) => JSX.Element> = {
          'staff-dashboard': ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
          'staff-products': ({ color }) => <IconSymbol size={24} name="cube.box.fill" color={color} />,
          'staff-sales': ({ color }) => <IconSymbol size={24} name="cart.fill" color={color} />,
          'staff-sales-history': ({ color }) => <IconSymbol size={24} name="clock.fill" color={color} />,
          'admin-dashboard': ({ color }) => <IconSymbol size={24} name="chart.bar.fill" color={color} />,
          'admin-users': ({ color }) => <IconSymbol size={24} name="person.fill" color={color} />,
          'admin-products': ({ color }) => <IconSymbol size={24} name="cube.box.fill" color={color} />,
          'admin-daily-sales': ({ color }) => <IconSymbol size={24} name="cart.fill" color={color} />,
          'admin-employees': ({ color }) => <IconSymbol size={24} name="person.fill" color={color} />,
          'admin-finance': ({ color }) => <IconSymbol size={24} name="chart.bar.fill" color={color} />,
          'admin-reports': ({ color }) => <IconSymbol size={24} name="chart.bar.fill" color={color} />,
          profile: ({ color }) => <IconSymbol size={24} name="person.fill" color={color} />,
        };

        if (['index', 'home', 'products'].includes(route.name)) {
          return hiddenOptions;
        }

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

        if (['admin-dashboard', 'admin-users', 'admin-products', 'admin-daily-sales', 'admin-employees', 'admin-finance', 'admin-reports'].includes(route.name)) {
          return isAdmin
            ? {
                ...commonOptions,
                title:
                  route.name === 'admin-dashboard'
                    ? 'Analytics'
                    : route.name === 'admin-users'
                    ? 'Users'
                    : route.name === 'admin-products'
                    ? 'Products'
                    : route.name === 'admin-daily-sales'
                    ? 'Sales'
                    : route.name === 'admin-employees'
                    ? 'Employees'
                    : route.name === 'admin-finance'
                    ? 'Finance'
                    : 'Reports',
                tabBarIcon: tabIcons[route.name],
                tabBarButton: renderHapticTab,
              }
            : hiddenOptions;
        }

        if (['staff-dashboard', 'staff-products', 'staff-sales', 'staff-sales-history'].includes(route.name)) {
          return isStaff
            ? {
                ...commonOptions,
                title:
                  route.name === 'staff-dashboard'
                    ? 'Dashboard'
                    : route.name === 'staff-products'
                    ? 'Products'
                    : route.name === 'staff-sales'
                    ? 'Sales'
                    : 'History',
                tabBarIcon: tabIcons[route.name],
                tabBarButton: renderHapticTab,
              }
            : hiddenOptions;
        }

        return hiddenOptions;
      }}
    >
      <Tabs.Screen name="staff-dashboard" />
      <Tabs.Screen name="staff-products" />
      <Tabs.Screen name="staff-sales" />
      <Tabs.Screen name="staff-sales-history" />
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
