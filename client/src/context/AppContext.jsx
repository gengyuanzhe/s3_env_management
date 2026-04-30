import React, { createContext, useContext, useReducer, useState, useCallback } from 'react';
import { logReducer, createLog } from './logReducer';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [environments, setEnvironments] = useState([]);
  const [commands, setCommands] = useState([]);
  const [logs, dispatchLog] = useReducer(logReducer, []);
  const [activeView, setActiveView] = useState({ type: 'empty' });
  const [buckets, setBuckets] = useState({});

  const addLog = useCallback((level, operation, detail) => {
    dispatchLog({ type: 'ADD_LOG', payload: createLog(level, operation, detail) });
  }, []);

  const clearLogs = useCallback(() => dispatchLog({ type: 'CLEAR_LOGS' }), []);

  const value = {
    environments, setEnvironments,
    commands, setCommands,
    logs, addLog, clearLogs,
    activeView, setActiveView,
    buckets, setBuckets,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}
