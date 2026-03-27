import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const FarmContext = createContext();

export const useFarm = () => useContext(FarmContext);

export const FarmProvider = ({ children }) => {
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchFarms = async () => {
    try {
      setLoading(true);
      const response = await api.get('/farms');
      const farmData = Array.isArray(response.data) ? response.data : (response.data.farms || []);
      setFarms(farmData);
      // Auto-select first farm if none selected
      if (farmData.length > 0 && !selectedFarm) {
        setSelectedFarm(farmData[0]);
      }
    } catch (err) {
      console.error("Error fetching farms for context:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarms();
  }, []);

  const selectFarmById = (farmId) => {
    if (farmId === 'all') {
      setSelectedFarm(null);
      return;
    }
    const farm = farms.find(f => f.id === farmId);
    if (farm) setSelectedFarm(farm);
  };

  return (
    <FarmContext.Provider value={{ farms, selectedFarm, setSelectedFarm, selectFarmById, refreshFarms: fetchFarms, loading }}>
      {children}
    </FarmContext.Provider>
  );
};

export default FarmContext;
