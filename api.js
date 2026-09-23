import { getMockSearch, getMockDetails } from './mockData.js';

const OMDB_API_KEY = process.env.EXPO_PUBLIC_OMDB_API_KEY || '';
const BASE_URL = 'http://www.omdbapi.com/';

export async function searchMovies(query, page = 1, type = 'all') {
  const trimmed = query ? query.trim() : '';
  if (!trimmed) {
    return {
      movies: [],
      totalResults: 0,
      hasMore: false,
      isMock: false,
      error: null,
    };
  }

  let url = `${BASE_URL}?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(trimmed)}&page=${page}`;
  if (type && type !== 'all') {
    url += `&type=${type}`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    const data = await response.json();

    if (data.Response === 'True') {
      const total = parseInt(data.totalResults, 10) || 0;
      return {
        movies: data.Search || [],
        totalResults: total,
        hasMore: page * 10 < total,
        isMock: false,
        error: null,
      };
    } else {
      const mock = getMockSearch(trimmed, page, type);
      if (mock.Response === 'True' && mock.Search.length > 0) {
        const total = parseInt(mock.totalResults, 10) || 0;
        return {
          movies: mock.Search,
          totalResults: total,
          hasMore: page * 10 < total,
          isMock: true,
          error: null,
        };
      }
      return {
        movies: [],
        totalResults: 0,
        hasMore: false,
        isMock: false,
        error: data.Error || 'No movies found.',
      };
    }
  } catch (err) {
    console.warn('OMDb network request failed, falling back to mockData:', err.message);
    const mock = getMockSearch(trimmed, page, type);
    const total = parseInt(mock.totalResults, 10) || 0;
    return {
      movies: mock.Search || [],
      totalResults: total,
      hasMore: page * 10 < total,
      isMock: true,
      error: mock.Search && mock.Search.length > 0 ? null : (mock.Error || 'Network error.'),
    };
  }
}

export async function getMovieDetails(imdbID) {
  if (!imdbID) {
    return { error: 'Invalid IMDb ID' };
  }

  const url = `${BASE_URL}?apikey=${OMDB_API_KEY}&i=${imdbID}&plot=full`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    const data = await response.json();

    if (data.Response === 'True') {
      return {
        movie: data,
        isMock: false,
        error: null,
      };
    } else {
      const mock = getMockDetails(imdbID);
      if (mock.Response === 'True') {
        return {
          movie: mock,
          isMock: true,
          error: null,
        };
      }
      return {
        movie: null,
        isMock: false,
        error: data.Error || 'Movie details not found.',
      };
    }
  } catch (err) {
    console.warn('OMDb details fetch failed, falling back to mockData:', err.message);
    const mock = getMockDetails(imdbID);
    if (mock.Response === 'True') {
      return {
        movie: mock,
        isMock: true,
        error: null,
      };
    }
    return {
      movie: null,
      isMock: true,
      error: 'Network connection failed.',
    };
  }
}
