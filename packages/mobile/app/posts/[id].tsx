import {
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Image,
} from "react-native";
import { useLocalSearchParams } from "expo-router";

import { Text, View } from "@/components/Themed";
import { useImageById } from "@decoded/shared";

const { width } = Dimensions.get("window");

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: image, isLoading, error } = useImageById(id ?? "");

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (error || !image) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorText}>Image not found</Text>
      </View>
    );
  }

  const account = image.postImages?.[0]?.post?.account ?? "Unknown";

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Image
        source={{ uri: image.image_url ?? undefined }}
        style={styles.heroImage}
        resizeMode="cover"
      />

      <View style={styles.content}>
        <Text style={styles.account}>@{account}</Text>
        <Text style={styles.date}>
          {new Date(image.created_at).toLocaleDateString()}
        </Text>

        {image.items && image.items.length > 0 && (
          <View style={styles.itemsSection}>
            <Text style={styles.sectionTitle}>Items</Text>
            {image.items.map((item, index) => (
              <View key={item.id ?? index} style={styles.itemCard}>
                {item.product_name && (
                  <Text style={styles.itemName}>{item.product_name}</Text>
                )}
                {item.brand && (
                  <Text style={styles.itemBrand}>{item.brand}</Text>
                )}
                {item.price && (
                  <Text style={styles.itemPrice}>{item.price}</Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    opacity: 0.7,
  },
  error: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 16,
    opacity: 0.5,
  },
  heroImage: {
    width: width,
    height: width * 1.25,
    backgroundColor: "#f0f0f0",
  },
  content: {
    padding: 16,
  },
  account: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 24,
  },
  itemsSection: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  itemCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "rgba(0,0,0,0.03)",
  },
  itemName: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 4,
  },
  itemBrand: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#007AFF",
  },
});
