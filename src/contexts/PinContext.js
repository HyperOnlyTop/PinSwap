import React, { createContext, useContext, useState } from 'react';

const PinContext = createContext();

export const usePin = () => {
  const context = useContext(PinContext);
  if (!context) {
    throw new Error('usePin must be used within a PinProvider');
  }
  return context;
};

export const PinProvider = ({ children }) => {
  const [pinTypes] = useState([
    { id: 1, name: 'Pin AA', points: 10, image: '/images/pin-aa.jpg' },
    { id: 2, name: 'Pin AAA', points: 8, image: '/images/pin-aaa.jpg' },
    { id: 3, name: 'Pin 9V', points: 15, image: '/images/pin-9v.jpg' },
    { id: 4, name: 'Pin C', points: 12, image: '/images/pin-c.jpg' },
    { id: 5, name: 'Pin D', points: 20, image: '/images/pin-d.jpg' },
    { id: 6, name: 'Pin Lithium', points: 25, image: '/images/pin-lithium.jpg' },
    { id: 7, name: 'Pin NiMH', points: 18, image: '/images/pin-nimh.jpg' },
    { id: 8, name: 'Pin NiCd', points: 15, image: '/images/pin-nicd.jpg' }
  ]);

  const [collectionHistory, setCollectionHistory] = useState([]);

  const [collectionRequests, setCollectionRequests] = useState([]);

  const addCollectionRequest = (request) => {
    const newRequest = {
      id: Date.now(),
      ...request,
      status: 'pending',
      date: new Date().toISOString().split('T')[0]
    };
    setCollectionRequests(prev => [...prev, newRequest]);
    return newRequest;
  };

  const updateCollectionRequest = (id, updates) => {
    setCollectionRequests(prev =>
      prev.map(request =>
        request.id === id ? { ...request, ...updates } : request
      )
    );
  };

  const addCollectionHistory = (collection) => {
    const newCollection = {
      id: Date.now(),
      ...collection,
      date: new Date().toISOString().split('T')[0],
      status: 'completed'
    };
    setCollectionHistory(prev => [...prev, newCollection]);
    return newCollection;
  };

  const getPinTypeById = (id) => {
    return pinTypes.find(type => type.id === id);
  };

  const getPinTypeByName = (name) => {
    return pinTypes.find(type => type.name === name);
  };

  const value = {
    pinTypes,
    collectionHistory,
    collectionRequests,
    addCollectionRequest,
    updateCollectionRequest,
    addCollectionHistory,
    getPinTypeById,
    getPinTypeByName
  };

  return (
    <PinContext.Provider value={value}>
      {children}
    </PinContext.Provider>
  );
};
