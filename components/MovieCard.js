import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import PropTypes from 'prop-types';
import PixelIcon from './PixelIcon';
import theme from '../styles/theme';

export default function MovieCard({ movie, onPress }) {
  const [imageError, setImageError] = useState(false);

  const hasPoster =
    movie.Poster && movie.Poster !== 'N/A' && !imageError;

  const typeLabel = movie.Type ? movie.Type.toUpperCase() : 'FILM';
  const isSeries = movie.Type === 'series';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.posterWrapper}>
        {hasPoster ? (
          <Image
            source={{ uri: movie.Poster }}
            style={styles.poster}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={styles.posterFallback}>
            <PixelIcon name="clapperboard" size={24} color="#64748B" />
            <Text style={styles.noPosterText}>NO IMG</Text>
          </View>
        )}
      </View>

      <View style={styles.infoCol}>
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.typeBadge,
              isSeries ? styles.seriesBadge : styles.movieBadge,
            ]}
          >
            <PixelIcon
              name={isSeries ? 'tv' : 'clapperboard'}
              size={12}
              color="#000000"
            />
            <Text style={styles.typeBadgeText}>[{typeLabel}]</Text>
          </View>

          <Text style={styles.imdbIdText}>{movie.imdbID}</Text>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {movie.Title}
        </Text>

        <View style={styles.yearRow}>
          <PixelIcon name="calendar" size={12} color="#64748B" />
          <Text style={styles.yearText}>{movie.Year}</Text>
        </View>
      </View>

      <View style={styles.chevronCol}>
        <View style={styles.chevronBox}>
          <PixelIcon name="chevron-right" size={16} color="#000000" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

MovieCard.propTypes = {
  movie: PropTypes.shape({
    Title: PropTypes.string.isRequired,
    Year: PropTypes.string,
    imdbID: PropTypes.string.isRequired,
    Type: PropTypes.string,
    Poster: PropTypes.string,
  }).isRequired,
  onPress: PropTypes.func.isRequired,
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderWidth: 2,
    borderColor: theme.colors.border,
    padding: 8,
    marginHorizontal: 12,
    marginVertical: 6,
    alignItems: 'center',
    ...theme.pixelShadow,
  },
  posterWrapper: {
    width: 64,
    height: 92,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: '#0F172A',
    overflow: 'hidden',
  },
  poster: {
    width: '100%',
    height: '100%',
  },
  posterFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
    gap: 4,
  },
  noPosterText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#64748B',
    fontFamily: theme.fonts.mono,
  },
  infoCol: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    paddingHorizontal: 5,
    paddingVertical: 1,
    gap: 3,
  },
  movieBadge: {
    backgroundColor: theme.colors.accentYellow,
  },
  seriesBadge: {
    backgroundColor: theme.colors.accentBlue,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#000000',
    fontFamily: theme.fonts.mono,
  },
  imdbIdText: {
    fontSize: 9,
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.mono,
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text,
    fontFamily: theme.fonts.mono,
    letterSpacing: 0.2,
    lineHeight: 18,
    marginBottom: 4,
  },
  yearRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  yearText: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.textMuted,
    fontFamily: theme.fonts.number,
  },
  chevronCol: {
    marginLeft: 8,
  },
  chevronBox: {
    width: 28,
    height: 28,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
