import { ScrollView, Text, View, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { useState } from 'react';

const ALL_PRODUCTS = [
  { id: '1', name: 'Professional Chef Knife', price: 89.99, category: 'Knives', stock: 15, image: '🔪' },
  { id: '2', name: 'Stainless Steel Pot Set', price: 149.99, category: 'Cookware', stock: 8, image: '🍲' },
  { id: '3', name: 'Silicone Spatula Set', price: 24.99, category: 'Tools', stock: 25, image: '🥄' },
  { id: '4', name: 'Cutting Board Pro', price: 34.99, category: 'Boards', stock: 12, image: '📋' },
  { id: '5', name: 'Mixing Bowl Set', price: 45.99, category: 'Bowls', stock: 20, image: '🥣' },
  { id: '6', name: 'Measuring Cups', price: 19.99, category: 'Tools', stock: 30, image: '📏' },
];

const CATEGORIES = ['All', 'Knives', 'Cookware', 'Tools', 'Boards', 'Bowls'];

export default function ProductsScreen() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filtered = ALL_PRODUCTS.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <ScreenContainer className="bg-background">
      <View className="flex-1">
        {/* Header */}
        <View className="px-6 py-4 gap-4 bg-surface/50">
          <Text className="text-2xl font-bold text-foreground">Products</Text>
          
          {/* Search */}
          <TextInput
            className="bg-background border border-border rounded-lg px-4 py-2 text-foreground"
            placeholder="Search products..."
            placeholderTextColor="#687076"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-6 py-3"
          contentContainerStyle={{ gap: 8 }}
        >
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              onPress={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full border ${
                selectedCategory === cat
                  ? 'bg-primary border-primary'
                  : 'bg-surface border-border'
              }`}
            >
              <Text
                className={`font-semibold ${
                  selectedCategory === cat ? 'text-background' : 'text-foreground'
                }`}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Products Grid */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20, gap: 12 }}
          columnWrapperStyle={{ gap: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity className="flex-1 bg-surface rounded-lg p-4">
              <View className="items-center gap-2">
                <Text className="text-4xl">{item.image}</Text>
                <Text className="text-foreground font-semibold text-center text-sm">{item.name}</Text>
                <Text className="text-primary font-bold">${item.price}</Text>
                <View className="flex-row items-center gap-1 mt-1">
                  <Text className="text-xs text-muted">Stock:</Text>
                  <Text className={`text-xs font-semibold ${item.stock > 0 ? 'text-success' : 'text-error'}`}>
                    {item.stock > 0 ? `${item.stock} left` : 'Out of stock'}
                  </Text>
                </View>
                <TouchableOpacity className="w-full bg-primary rounded-lg py-2 mt-2">
                  <Text className="text-background text-center font-semibold text-xs">Add to Cart</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-12">
              <Text className="text-muted">No products found</Text>
            </View>
          }
        />
      </View>
    </ScreenContainer>
  );
}
