const QUEUE_KEY = 'offline_request_queue';

export const getQueue = () => {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY)) || [];
  } catch {
    return [];
  }
};

export const addToQueue = (requestData) => {
  const queue = getQueue();
  queue.push({ ...requestData, queuedAt: new Date().toISOString() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};

export const clearQueue = () => {
  localStorage.setItem(QUEUE_KEY, JSON.stringify([]));
};

export const removeFromQueue = (index) => {
  const queue = getQueue();
  queue.splice(index, 1);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
};
