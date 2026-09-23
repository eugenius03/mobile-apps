import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  Keyboard,
} from 'react-native';
import PropTypes from 'prop-types';
import PixelIcon from '../components/PixelIcon';
import MovieCard from '../components/MovieCard';
import { searchMovies } from '../api';
import theme from '../styles/theme';

const FILTER_TYPES = [
  { id: 'all', label: 'ALL' },
  { id: 'movie', label: 'MOVIES' },
  { id: 'series', label: 'SERIES' },
  { id: 'episode', label: 'EPISODES' },
];

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState('Matrix');
  const [activeType, setActiveType] = useState('all');
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isMockMode, setIsMockMode] = useState(false);

  const flatListRef = useRef(null);

  const performSearch = useCallback(
    async (searchTerm, searchPage = 1, type = activeType, append = false) => {
      if (!searchTerm || !searchTerm.trim()) {
        setMovies([]);
        setTotalResults(0);
        setErrorMsg('ENTER KEYWORD TO SEARCH');
        return;
      }

      if (searchPage === 1) {
        setLoading(true);
        setErrorMsg(null);
      } else {
        setLoadingMore(true);
      }

      const result = await searchMovies(searchTerm, searchPage, type);

      if (result.error) {
        if (!append) {
          setMovies([]);
          setTotalResults(0);
        }
        setErrorMsg(result.error);
      } else {
        setErrorMsg(null);
        setTotalResults(result.totalResults);
        setIsMockMode(result.isMock);

        if (append) {
          setMovies((prev) => {
            const existingIds = new Set(prev.map((m) => m.imdbID));
            const newUnique = result.movies.filter(
              (m) => !existingIds.has(m.imdbID)
            );
            return [...prev, ...newUnique];
          });
        } else {
          setMovies(result.movies);
        }
        setPage(searchPage);
      }

      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    },
    [activeType]
  );

  useEffect(() => {
    performSearch('Matrix', 1, 'all');
  }, [performSearch]);

  const handleSearchSubmit = () => {
    Keyboard.dismiss();
    performSearch(query, 1, activeType, false);
  };

  const handleTypeSelect = (typeId) => {
    setActiveType(typeId);
    performSearch(query, 1, typeId, false);
  };

  const handleLoadMore = () => {
    if (loading || loadingMore) return;
    if (movies.length >= totalResults) return;

    const nextPage = page + 1;
    performSearch(query, nextPage, activeType, true);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    performSearch(query, 1, activeType, false);
  };

  const handleClear = () => {
    setQuery('');
  };

  const renderResultsBanner = () => {
    if (loading || movies.length === 0) return null;

    return (
      <View style={styles.resultsBanner}>
        <Text style={styles.resultsCountText}>
          FOUND {totalResults} ENTRIES • SHOWING {movies.length}
        </Text>
        <Text style={styles.pageIndicator}>
          PAGE {page} OF {Math.ceil(totalResults / 10) || 1}
        </Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (loading) return null;

    const hasMore = movies.length < totalResults;

    if (loadingMore) {
      return (
        <View style={styles.footerLoading}>
          <ActivityIndicator size="small" color="#000000" />
          <Text style={styles.footerLoadingText}>
            LOADING NEXT 10 RESULTS...
          </Text>
        </View>
      );
    }

    if (hasMore && movies.length > 0) {
      return (
        <View style={styles.loadMoreContainer}>
          <TouchableOpacity
            style={styles.loadMoreBtn}
            onPress={handleLoadMore}
            activeOpacity={0.8}
          >
            <PixelIcon name="chevron-right" size={16} color="#FFFFFF" />
            <Text style={styles.loadMoreBtnText}>
              LOAD MORE RESULTS (+10)
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (movies.length > 0 && !hasMore) {
      return (
        <View style={styles.endOfResults}>
          <Text style={styles.endOfResultsText}>
            ■ ALL {totalResults} RESULTS LOADED ■
          </Text>
        </View>
      );
    }

    return null;
  };

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.emptyLoadingText}>SEARCHING OMDB ARCHIVE...</Text>
        </View>
      );
    }

    const isEmptyQuery = !query.trim() || errorMsg === 'ENTER KEYWORD TO SEARCH';

    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconBox}>
          <PixelIcon name={isEmptyQuery ? 'search' : 'warning-diamond'} size={32} color="#000000" />
        </View>
        <Text style={styles.emptyTitle}>{isEmptyQuery ? 'READY TO SEARCH' : 'NO MOVIES FOUND'}</Text>
        <Text style={styles.emptySubtitle}>
          {errorMsg || 'ENTER A KEYWORD TO SEARCH OMDB'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <PixelIcon name="clapperboard" size={20} color="#000000" />
        <Text style={styles.topBarText}>[ MOVIE ARCHIVE ]</Text>
      </View>
      <View style={styles.headerArea}>
        <View style={styles.searchBarWrapper}>
          <View style={styles.searchIconBox}>
            <PixelIcon name="search" size={18} color="#000000" />
          </View>

          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="SEARCH FILM DATABASE..."
            placeholderTextColor="#94A3B8"
            returnKeyType="search"
            onSubmitEditing={handleSearchSubmit}
            autoCorrect={false}
            autoCapitalize="none"
          />

          {query.length > 0 && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={handleClear}
              activeOpacity={0.7}
            >
              <PixelIcon name="close" size={14} color="#64748B" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.searchSubmitBtn}
            onPress={handleSearchSubmit}
            activeOpacity={0.8}
          >
            <Text style={styles.searchSubmitText}>FIND</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filtersRow}>
          <View style={styles.filterLabel}>
            <PixelIcon name="sliders-horizontal" size={14} color="#64748B" />
            <Text style={styles.filterLabelText}>TYPE:</Text>
          </View>

          {FILTER_TYPES.map((filter) => {
            const isActive = activeType === filter.id;
            return (
              <TouchableOpacity
                key={filter.id}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => handleTypeSelect(filter.id)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {isMockMode && (
          <View style={styles.mockBanner}>
            <PixelIcon name="warning-diamond" size={14} color="#D97706" />
            <Text style={styles.mockBannerText}>
              OFFLINE MODE: SERVING FROM LOCAL ARCHIVE
            </Text>
          </View>
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={movies}
        keyExtractor={(item, index) => `${item.imdbID}_${index}`}
        renderItem={({ item }) => (
          <MovieCard
            movie={item}
            onPress={() =>
              navigation.navigate('Details', {
                imdbID: item.imdbID,
                title: item.Title,
              })
            }
          />
        )}
        ListHeaderComponent={renderResultsBanner}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.4}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      />
    </SafeAreaView>
  );
}

SearchScreen.propTypes = {
  navigation: PropTypes.shape({
    navigate: PropTypes.func.isRequired,
  }).isRequired,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  topBar: {
    height: 48,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
  },
  topBarText: {
    fontFamily: theme.fonts.mono,
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.8,
  },
  listContent: {
    paddingBottom: 24,
  },
  headerArea: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: theme.colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderWidth: 2,
    borderColor: theme.colors.border,
    height: 46,
    ...theme.pixelShadow,
  },
  searchIconBox: {
    paddingLeft: 10,
    paddingRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: theme.fonts.mono,
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: 0.5,
  },
  clearBtn: {
    paddingHorizontal: 8,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSubmitBtn: {
    backgroundColor: theme.colors.border,
    height: '100%',
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSubmitText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.mono,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  filterLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterLabelText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
    fontFamily: theme.fonts.mono,
  },
  filterChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  filterChipActive: {
    backgroundColor: '#000000',
  },
  filterChipText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#000000',
    fontFamily: theme.fonts.mono,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  mockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#D97706',
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  mockBannerText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309',
    fontFamily: theme.fonts.mono,
  },
  resultsBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  resultsCountText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#475569',
    fontFamily: theme.fonts.mono,
    letterSpacing: 0.4,
  },
  pageIndicator: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    fontFamily: theme.fonts.mono,
  },
  footerLoading: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  footerLoadingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    fontFamily: theme.fonts.mono,
  },
  loadMoreContainer: {
    paddingHorizontal: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  loadMoreBtn: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: theme.colors.border,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...theme.pixelShadow,
  },
  loadMoreBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    fontFamily: theme.fonts.mono,
    letterSpacing: 0.8,
  },
  endOfResults: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  endOfResultsText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    fontFamily: theme.fonts.mono,
    letterSpacing: 0.8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIconBox: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...theme.pixelShadow,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#000000',
    fontFamily: theme.fonts.mono,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    fontFamily: theme.fonts.mono,
    textAlign: 'center',
  },
  emptyLoadingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    fontFamily: theme.fonts.mono,
    marginTop: 12,
    letterSpacing: 0.8,
  },
});
