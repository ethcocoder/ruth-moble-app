import { ScrollView, Text, View, TouchableOpacity, FlatList } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useRouter } from 'expo-router';
import { useAuthContext } from '@/lib/auth-context';

const FEATURED_PRODUCTS = [
  { id: '1', name: 'Professional Chef Knife', price: 89.99, image: '🔪' },
  { id: '2', name: 'Stainless Steel Pot Set', price: 149.99, image: '🍲' },
  { id: '3', name: 'Silicone Spatula Set', price: 24.99, image: '🥄' },
  { id: '4', name: 'Cutting Board Pro', price: 34.99, image: '📋' },
];

const TESTIMONIALS = [
  { id: '1', author: 'Sarah M.', text: 'Best kitchen equipment I\'ve bought!', rating: 5 },
  { id: '2', author: 'John D.', text: 'Great quality and fast delivery.', rating: 5 },
  { id: '3', author: 'Emma L.', text: 'Highly recommend Kitch!', rating: 5 },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user, userRole } = useAuthContext();

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <View className="bg-gradient-to-b from-primary/20 to-background px-6 py-12 gap-4">
          <Text className="text-4xl font-bold text-foreground">Welcome to Kitch</Text>
          <Text className="text-base text-muted leading-relaxed">
            Professional kitchen equipment for home chefs and restaurants
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/products')}
            className="bg-primary rounded-lg py-3 items-center"
          >
            <Text className="text-background font-semibold">Shop Now</Text>
          </TouchableOpacity>
        </View>

        {/* Featured Products */}
        <View className="px-6 py-8 gap-4">
          <Text className="text-2xl font-bold text-foreground">Featured Products</Text>
          <FlatList
            data={FEATURED_PRODUCTS}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => router.push('/(tabs)/products')}
                className="bg-surface rounded-lg p-4 mb-3 flex-row items-center gap-4"
              >
                <Text className="text-4xl">{item.image}</Text>
                <View className="flex-1">
                  <Text className="text-foreground font-semibold">{item.name}</Text>
                  <Text className="text-primary font-bold mt-1">${item.price}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Features Section */}
        <View className="px-6 py-8 gap-4 bg-surface/50">
          <Text className="text-2xl font-bold text-foreground">Why Choose Kitch?</Text>
          <View className="gap-3">
            {[
              { icon: '✓', title: 'Premium Quality', desc: 'Professional-grade equipment' },
              { icon: '⚡', title: 'Fast Shipping', desc: 'Delivered in 2-3 business days' },
              { icon: '💰', title: 'Best Prices', desc: 'Competitive pricing guaranteed' },
              { icon: '🛡️', title: 'Warranty', desc: '2-year warranty on all products' },
            ].map((feature, idx) => (
              <View key={idx} className="flex-row gap-3 items-start">
                <Text className="text-xl">{feature.icon}</Text>
                <View className="flex-1">
                  <Text className="text-foreground font-semibold">{feature.title}</Text>
                  <Text className="text-muted text-sm">{feature.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Testimonials */}
        <View className="px-6 py-8 gap-4">
          <Text className="text-2xl font-bold text-foreground">Customer Reviews</Text>
          <FlatList
            data={TESTIMONIALS}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View className="bg-surface rounded-lg p-4 mb-3">
                <View className="flex-row justify-between items-start mb-2">
                  <Text className="text-foreground font-semibold">{item.author}</Text>
                  <Text className="text-warning">{'⭐'.repeat(item.rating)}</Text>
                </View>
                <Text className="text-muted">{item.text}</Text>
              </View>
            )}
          />
        </View>

        {/* CTA Section */}
        <View className="px-6 py-8 gap-4 bg-primary/10">
          <Text className="text-xl font-bold text-foreground">Ready to Get Started?</Text>
          {!user ? (
            <TouchableOpacity
              onPress={() => router.push('/auth/login')}
              className="bg-primary rounded-lg py-3 items-center"
            >
              <Text className="text-background font-semibold">Sign In to Continue</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/products')}
              className="bg-primary rounded-lg py-3 items-center"
            >
              <Text className="text-background font-semibold">Browse All Products</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
