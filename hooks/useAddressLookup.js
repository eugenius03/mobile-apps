import { useCallback, useEffect, useRef, useState } from 'react';
import * as api from '../api';
import { MAX_ROWS, MIN_STREET_CHARS, filterDistricts } from '../utils/address';

const SEARCH_DEBOUNCE_MS = 300;
const COMMIT_DELAY_MS = 250;

export default function useAddressLookup() {
  const [districts, setDistricts] = useState([api.CITY]);
  const [district, setDistrict] = useState(api.CITY);
  const [districtText, setDistrictText] = useState(api.CITY);
  const [districtFilter, setDistrictFilter] = useState(null);
  const [districtOpen, setDistrictOpen] = useState(false);
  const [streetQuery, setStreetQuery] = useState('');
  const [streets, setStreets] = useState([]);
  const [street, setStreet] = useState(null);
  const [houses, setHouses] = useState([]);
  const [houseQuery, setHouseQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const districtRef = useRef(district);
  districtRef.current = district;

  useEffect(() => {
    api.fetchDistricts().then(setDistricts, () => {});
  }, []);

  useEffect(() => {
    const q = streetQuery.trim();
    if (q.length < MIN_STREET_CHARS) {
      setStreets([]);
      setError(null);
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const found = await api.searchStreets(district, q);
        if (cancelled) return;
        setStreets(found.slice(0, MAX_ROWS));
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setStreets([]);
        setError(e.message);
      }
      setSearching(false);
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [streetQuery, district]);

  const chooseDistrict = useCallback((value) => {
    setDistrict(value);
    setDistrictText(value);
    setStreet(null);
    setHouses([]);
    setStreets([]);
    setStreetQuery('');
  }, []);

  const changeDistrictText = (value) => {
    setDistrictText(value);
    setDistrictFilter(value);
    setDistrictOpen(true);
    const exact = districts.find((d) => d.toLowerCase() === value.trim().toLowerCase());
    if (exact && exact !== district) chooseDistrict(exact);
  };

  const pickDistrict = (value) => {
    chooseDistrict(value);
    setDistrictOpen(false);
  };

  const openDistricts = () => {
    setDistrictOpen(true);
    setDistrictFilter(null);
  };

  const toggleDistricts = () => {
    setDistrictOpen((open) => !open);
    setDistrictFilter(null);
  };

  const commitDistrict = () => {
    setTimeout(() => {
      setDistrictOpen(false);
      setDistrictText((text) => (districts.includes(text) ? text : districtRef.current));
    }, COMMIT_DELAY_MS);
  };

  const pickStreet = async (value) => {
    try {
      setHouses(await api.fetchHouses(district, value));
      setStreet(value);
      setStreets([]);
      setError(null);
      setHouseQuery('');
    } catch (e) {
      setError(e.message);
    }
  };

  const clearStreet = () => {
    setStreet(null);
    setHouses([]);
    setHouseQuery('');
  };

  const suggestions = districtOpen ? filterDistricts(districts, districtFilter) : [];

  return {
    district,
    districtText,
    districtOpen,
    suggestions,
    changeDistrictText,
    pickDistrict,
    openDistricts,
    toggleDistricts,
    commitDistrict,
    streetQuery,
    setStreetQuery,
    streets,
    street,
    searching,
    pickStreet,
    clearStreet,
    houses,
    houseQuery,
    setHouseQuery,
    error,
    setError,
  };
}
