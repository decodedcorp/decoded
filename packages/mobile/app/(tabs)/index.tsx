import { useCallback } from "react";
import {
  FlatList,
  StyleSheet,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Image,
} from "react-native";
import { Link } from "expo-router";

import { Text, View } from "@/components/Themed";
import { useSupabaseContext } from "@/providers/SupabaseProvider";
import {
  useInfiniteFilteredImages,
  useFilterStore,
  type ImageWithPostId,
} from "@decoded/shared";

const { width } = Dimensions.get("window");
const COLUMN_COUNT = 2;
const GAP = 4;
const CARD_WIDTH = (width - GAP * (COLUMN_COUNT + 1)) / COLUMN_COUNT;
const CARD_HEIGHT = CARD_WIDTH * 1.25;

export default function HomeScreen() {
  const { isInitialized } = useSupabaseContext();
  const { activeFilter } = useFilterStore();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteFilteredImages({
      limit: 40,
      filter: activeFilter,
      search: "",
      deduplicateByImageId: true,
    });

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  const renderItem = useCallback(
    ({ item }: { item: ImageWithPostId }) => (
      <Link href={`/posts/${item.id}`} asChild>
        <Pressable style={styles.card}>
          <Image
            source={{ uri: item.image_url ?? undefined }}
            style={styles.image}
            resizeMode="cover"
          />
        </Pressable>
      </Link>
    ),
    [],
  );

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const keyExtractor = useCallback((item: ImageWithPostId) => item.id, []);

  if (!isInitialized) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading images...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        numColumns={COLUMN_COUNT}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footer}>
              <ActivityIndicator size="small" />
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No images found</Text>
          </View>
        }
      />
    </View>
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
  listContent: {
    padding: GAP,
  },
  row: {
    gap: GAP,
    marginBottom: GAP,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#f0f0f0",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  footer: {
    padding: 20,
    alignItems: "center",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.5,
  },
});
