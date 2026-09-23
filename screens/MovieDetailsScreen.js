import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import PropTypes from 'prop-types';
import PixelIcon from '../components/PixelIcon';
import { getMovieDetails } from '../api';
import theme from '../styles/theme';

export default function MovieDetailsScreen({ route, navigation }) {
  const { imdbID } = route.params;

  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [posterError, setPosterError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchDetails() {
      setLoading(true);
      setErrorMsg(null);

      const result = await getMovieDetails(imdbID);

      if (isMounted) {
        if (result.error) {
          setErrorMsg(result.error);
        } else {
          setMovie(result.movie);
        }
        setLoading(false);
      }
    }

    fetchDetails();

    return () => {
      isMounted = false;
    };
  }, [imdbID]);

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <PixelIcon name="arrow-left" size={16} color="#000000" />
            <Text style={styles.backBtnText}>BACK</Text>
          </TouchableOpacity>
          <View style={styles.topBarTitle}>
            <PixelIcon name="camera" size={18} color="#000000" />
            <Text style={styles.topBarText}>[ FILM DOSSIER ]</Text>
          </View>
          <View style={styles.topBarSpacer} />
        </View>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#000000" />
          <Text style={styles.loadingText}>DECRYPTING MOVIE DOSSIER...</Text>
          <Text style={styles.loadingSub}>IMDb ID: {imdbID}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMsg || !movie) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <PixelIcon name="arrow-left" size={16} color="#000000" />
            <Text style={styles.backBtnText}>BACK</Text>
          </TouchableOpacity>
          <View style={styles.topBarTitle}>
            <PixelIcon name="camera" size={18} color="#000000" />
            <Text style={styles.topBarText}>[ FILM DOSSIER ]</Text>
          </View>
          <View style={styles.topBarSpacer} />
        </View>
        <View style={styles.errorCard}>
          <PixelIcon name="warning-diamond" size={36} color="#000000" />
          <Text style={styles.errorTitle}>DOSSIER RETRIEVAL FAILED</Text>
          <Text style={styles.errorDesc}>{errorMsg || 'Movie details unavailable.'}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <PixelIcon name="arrow-left" size={16} color="#FFFFFF" />
            <Text style={styles.retryBtnText}>RETURN TO SEARCH</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const hasPoster = movie.Poster && movie.Poster !== 'N/A' && !posterError;
  const genres = movie.Genre ? movie.Genre.split(',').map((g) => g.trim()) : [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <PixelIcon name="arrow-left" size={16} color="#000000" />
          <Text style={styles.backBtnText}>BACK</Text>
        </TouchableOpacity>
        <View style={styles.topBarTitle}>
          <PixelIcon name="camera" size={18} color="#000000" />
          <Text style={styles.topBarText}>[ FILM DOSSIER ]</Text>
        </View>
        <View style={styles.topBarSpacer} />
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.tagId}>
              <Text style={styles.tagIdText}>ID: {movie.imdbID}</Text>
            </View>
            {movie.Rated && movie.Rated !== 'N/A' && (
              <View style={styles.tagRated}>
                <Text style={styles.tagRatedText}>[{movie.Rated}]</Text>
              </View>
            )}
          </View>

          <Text style={styles.title}>{movie.Title}</Text>

          <View style={styles.quickStatsRow}>
            <View style={styles.quickStat}>
              <PixelIcon name="calendar" size={14} color="#000000" />
              <Text style={styles.quickStatText}>{movie.Year || 'N/A'}</Text>
            </View>

            <Text style={styles.statDot}>•</Text>

            <View style={styles.quickStat}>
              <PixelIcon name="clock" size={14} color="#000000" />
              <Text style={styles.quickStatText}>{movie.Runtime || 'N/A'}</Text>
            </View>

            {movie.Released && movie.Released !== 'N/A' && (
              <>
                <Text style={styles.statDot}>•</Text>
                <Text style={styles.quickStatText}>{movie.Released}</Text>
              </>
            )}
          </View>

          <View style={styles.posterContainer}>
            {hasPoster ? (
              <Image
                source={{ uri: movie.Poster }}
                style={styles.posterImage}
                resizeMode="cover"
                onError={() => setPosterError(true)}
              />
            ) : (
              <View style={styles.posterPlaceholder}>
                <PixelIcon name="clapperboard" size={48} color="#64748B" />
                <Text style={styles.posterPlaceholderText}>NO POSTER ARCHIVED</Text>
              </View>
            )}
          </View>

          {genres.length > 0 && (
            <View style={styles.genreRow}>
              {genres.map((genre, idx) => (
                <View key={idx} style={styles.genreChip}>
                  <Text style={styles.genreChipText}>[ {genre.toUpperCase()} ]</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>[ CRITICAL RATINGS ]</Text>
          <View style={styles.ratingsRow}>
            <View style={styles.ratingBox}>
              <View style={styles.ratingTop}>
                <PixelIcon name="star" size={18} color={theme.colors.ratingStar} />
                <Text style={styles.ratingScore}>{movie.imdbRating || 'N/A'}</Text>
              </View>
              <Text style={styles.ratingLabel}>IMDb / 10</Text>
              {movie.imdbVotes && (
                <Text style={styles.votesText}>{movie.imdbVotes} votes</Text>
              )}
            </View>

            {movie.Metascore && movie.Metascore !== 'N/A' && (
              <View style={[styles.ratingBox, styles.metaBox]}>
                <Text style={styles.metaScore}>{movie.Metascore}</Text>
                <Text style={styles.ratingLabel}>METASCORE</Text>
                <Text style={styles.votesText}>Critique avg</Text>
              </View>
            )}

            {movie.Ratings && movie.Ratings.length > 1 && (
              <View style={styles.ratingBox}>
                <Text style={styles.rtScore}>
                  {movie.Ratings[1].Value}
                </Text>
                <Text style={styles.ratingLabel} numberOfLines={1}>
                  {movie.Ratings[1].Source === 'Rotten Tomatoes'
                    ? 'TOMATOES'
                    : 'RATING'}
                </Text>
                <Text style={styles.votesText}>Verified</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>[ SYNOPSIS & PLOT ]</Text>
          <View style={styles.plotBox}>
            <Text style={styles.plotText}>
              {movie.Plot && movie.Plot !== 'N/A'
                ? movie.Plot
                : 'No plot synopsis provided for this entry.'}
            </Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>[ CREDITS & TALENT ]</Text>

          <View style={styles.creditItem}>
            <View style={styles.creditLabelRow}>
              <PixelIcon name="user" size={14} color="#000000" />
              <Text style={styles.creditLabel}>DIRECTOR</Text>
            </View>
            <Text style={styles.creditValue}>{movie.Director || 'N/A'}</Text>
          </View>

          {movie.Writer && movie.Writer !== 'N/A' && (
            <View style={styles.creditItem}>
              <View style={styles.creditLabelRow}>
                <PixelIcon name="user" size={14} color="#000000" />
                <Text style={styles.creditLabel}>WRITER(S)</Text>
              </View>
              <Text style={styles.creditValue}>{movie.Writer}</Text>
            </View>
          )}

          {movie.Actors && movie.Actors !== 'N/A' && (
            <View style={[styles.creditItem, { borderBottomWidth: 0 }]}>
              <View style={styles.creditLabelRow}>
                <PixelIcon name="users" size={14} color="#000000" />
                <Text style={styles.creditLabel}>STARRING CAST</Text>
              </View>
              <Text style={styles.creditValue}>{movie.Actors}</Text>
            </View>
          )}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>[ PRODUCTION DOSSIER ]</Text>

          {movie.Awards && movie.Awards !== 'N/A' && (
            <View style={styles.specRow}>
              <PixelIcon name="trophy" size={16} color="#D97706" />
              <View style={styles.specContent}>
                <Text style={styles.specLabel}>HONORS & AWARDS</Text>
                <Text style={styles.specValue}>{movie.Awards}</Text>
              </View>
            </View>
          )}

          {movie.BoxOffice && movie.BoxOffice !== 'N/A' && (
            <View style={styles.specRow}>
              <PixelIcon name="dollar" size={16} color="#059669" />
              <View style={styles.specContent}>
                <Text style={styles.specLabel}>BOX OFFICE REVENUE</Text>
                <Text style={styles.specValue}>{movie.BoxOffice}</Text>
              </View>
            </View>
          )}

          <View style={styles.specRow}>
            <PixelIcon name="clapperboard" size={16} color="#000000" />
            <View style={styles.specContent}>
              <Text style={styles.specLabel}>ORIGIN & LANGUAGE</Text>
              <Text style={styles.specValue}>
                {movie.Country || 'Unknown'} • {movie.Language || 'Unknown'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.backFooterBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <PixelIcon name="arrow-left" size={18} color="#FFFFFF" />
          <Text style={styles.backFooterText}>RETURN TO SEARCH RESULTS</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

MovieDetailsScreen.propTypes = {
  route: PropTypes.shape({
    params: PropTypes.shape({
      imdbID: PropTypes.string.isRequired,
      title: PropTypes.string,
    }).isRequired,
  }).isRequired,
  navigation: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
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
    borderBottomWidth: 2,
    borderBottomColor: '#000000',
    paddingHorizontal: 8,
  },
  topBarTitle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  topBarText: {
    fontFamily: theme.fonts.mono,
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.8,
  },
  topBarSpacer: {
    width: 60,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
    paddingVertical: 4,
    paddingHorizontal: 8,
    ...theme.pixelShadowSmall,
  },
  backBtnText: {
    fontFamily: theme.fonts.mono,
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  scrollContent: {
    padding: 12,
    paddingBottom: 36,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    fontFamily: theme.fonts.mono,
    fontSize: 13,
    fontWeight: '900',
    color: '#000000',
    marginTop: 16,
    letterSpacing: 0.8,
  },
  loadingSub: {
    fontFamily: theme.fonts.mono,
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 6,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  errorCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    fontFamily: theme.fonts.mono,
    fontSize: 14,
    fontWeight: '900',
    color: '#000000',
    marginTop: 12,
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  errorDesc: {
    fontFamily: theme.fonts.mono,
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#000000',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.mono,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: theme.colors.border,
    padding: 14,
    marginBottom: 12,
    ...theme.pixelShadow,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagId: {
    backgroundColor: '#F1F4F8',
    borderWidth: 1.5,
    borderColor: '#000000',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagIdText: {
    fontFamily: theme.fonts.mono,
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
  },
  tagRated: {
    backgroundColor: theme.colors.accentYellow,
    borderWidth: 1.5,
    borderColor: '#000000',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagRatedText: {
    fontFamily: theme.fonts.mono,
    fontSize: 10,
    fontWeight: '900',
    color: '#000000',
  },
  title: {
    fontFamily: theme.fonts.mono,
    fontSize: 20,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
    lineHeight: 26,
    marginBottom: 8,
  },
  quickStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  quickStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quickStatText: {
    fontFamily: theme.fonts.number,
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  statDot: {
    color: '#94A3B8',
    fontWeight: '900',
  },
  posterContainer: {
    alignItems: 'center',
    marginVertical: 6,
  },
  posterImage: {
    width: 200,
    height: 295,
    borderWidth: 3,
    borderColor: '#000000',
    backgroundColor: '#0F172A',
    ...theme.pixelShadow,
  },
  posterPlaceholder: {
    width: 200,
    height: 295,
    borderWidth: 3,
    borderColor: '#000000',
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  posterPlaceholderText: {
    fontFamily: theme.fonts.mono,
    fontSize: 9,
    fontWeight: '800',
    color: '#64748B',
    textAlign: 'center',
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
    justifyContent: 'center',
  },
  genreChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#000000',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  genreChipText: {
    fontFamily: theme.fonts.mono,
    fontSize: 10,
    fontWeight: '900',
    color: '#000000',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: theme.colors.border,
    padding: 12,
    marginBottom: 12,
    ...theme.pixelShadow,
  },
  sectionHeader: {
    fontFamily: theme.fonts.mono,
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  ratingsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#000000',
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
  },
  ratingTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingScore: {
    fontFamily: theme.fonts.number,
    fontSize: 16,
    fontWeight: '900',
    color: '#000000',
  },
  metaBox: {
    backgroundColor: '#FEF9C3',
  },
  metaScore: {
    fontFamily: theme.fonts.number,
    fontSize: 18,
    fontWeight: '900',
    color: '#854D0E',
  },
  rtScore: {
    fontFamily: theme.fonts.number,
    fontSize: 18,
    fontWeight: '900',
    color: '#DC2626',
  },
  ratingLabel: {
    fontFamily: theme.fonts.mono,
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
    marginTop: 3,
  },
  votesText: {
    fontFamily: theme.fonts.mono,
    fontSize: 8,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 2,
  },
  plotBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#000000',
    padding: 12,
  },
  plotText: {
    fontFamily: theme.fonts.mono,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
    color: '#1E293B',
    letterSpacing: 0.2,
  },
  creditItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  creditLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  creditLabel: {
    fontFamily: theme.fonts.mono,
    fontSize: 9,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  creditValue: {
    fontFamily: theme.fonts.mono,
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
    lineHeight: 18,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  specContent: {
    flex: 1,
  },
  specLabel: {
    fontFamily: theme.fonts.mono,
    fontSize: 9,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.4,
  },
  specValue: {
    fontFamily: theme.fonts.mono,
    fontSize: 12,
    fontWeight: '700',
    color: '#000000',
    marginTop: 2,
  },
  backFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#000000',
    paddingVertical: 14,
    marginTop: 4,
    marginBottom: 16,
    ...theme.pixelShadow,
  },
  backFooterText: {
    color: '#FFFFFF',
    fontFamily: theme.fonts.mono,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
