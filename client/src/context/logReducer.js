export function logReducer(state, action) {
  switch (action.type) {
    case 'ADD_LOG':
      return [action.payload, ...state];
    case 'CLEAR_LOGS':
      return [];
    default:
      return state;
  }
}

export function createLog(level, operation, detail) {
  const now = new Date();
  const time = now.toTimeString().slice(0, 8);
  return { time, level, operation, detail, id: Date.now() + Math.random() };
}
