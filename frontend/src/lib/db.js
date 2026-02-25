// IndexedDB wrapper for offline storage
const DB_NAME = 'shopping-list-db';
const DB_VERSION = 1;

let db = null;

export const initDB = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // Shopping Lists store
      if (!database.objectStoreNames.contains('lists')) {
        const listsStore = database.createObjectStore('lists', { keyPath: 'id' });
        listsStore.createIndex('user_id', 'user_id', { unique: false });
        listsStore.createIndex('updated_at', 'updated_at', { unique: false });
      }

      // Items store
      if (!database.objectStoreNames.contains('items')) {
        const itemsStore = database.createObjectStore('items', { keyPath: 'id' });
        itemsStore.createIndex('list_id', 'list_id', { unique: false });
        itemsStore.createIndex('updated_at', 'updated_at', { unique: false });
      }

      // Pending changes store (for sync)
      if (!database.objectStoreNames.contains('pending')) {
        database.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
      }

      // Sync metadata
      if (!database.objectStoreNames.contains('metadata')) {
        database.createObjectStore('metadata', { keyPath: 'key' });
      }
    };
  });
};

// Generic operations
const getStore = async (storeName, mode = 'readonly') => {
  const database = await initDB();
  const transaction = database.transaction(storeName, mode);
  return transaction.objectStore(storeName);
};

export const getAllFromStore = async (storeName, indexName = null, indexValue = null) => {
  const store = await getStore(storeName);
  
  return new Promise((resolve, reject) => {
    let request;
    if (indexName && indexValue !== null) {
      const index = store.index(indexName);
      request = index.getAll(indexValue);
    } else {
      request = store.getAll();
    }
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getFromStore = async (storeName, key) => {
  const store = await getStore(storeName);
  
  return new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const putToStore = async (storeName, data) => {
  const store = await getStore(storeName, 'readwrite');
  
  return new Promise((resolve, reject) => {
    const request = store.put(data);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const deleteFromStore = async (storeName, key) => {
  const store = await getStore(storeName, 'readwrite');
  
  return new Promise((resolve, reject) => {
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const clearStore = async (storeName) => {
  const store = await getStore(storeName, 'readwrite');
  
  return new Promise((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// List operations
export const getLists = async (userId) => {
  return getAllFromStore('lists', 'user_id', userId);
};

export const getList = async (listId) => {
  return getFromStore('lists', listId);
};

export const saveList = async (list) => {
  return putToStore('lists', list);
};

export const deleteList = async (listId) => {
  // Delete list
  await deleteFromStore('lists', listId);
  // Delete all items in list
  const items = await getAllFromStore('items', 'list_id', listId);
  for (const item of items) {
    await deleteFromStore('items', item.id);
  }
};

// Item operations
export const getItems = async (listId) => {
  return getAllFromStore('items', 'list_id', listId);
};

export const getItem = async (itemId) => {
  return getFromStore('items', itemId);
};

export const saveItem = async (item) => {
  return putToStore('items', item);
};

export const deleteItem = async (itemId) => {
  return deleteFromStore('items', itemId);
};

// Pending changes (for sync)
export const addPendingChange = async (change) => {
  return putToStore('pending', {
    ...change,
    timestamp: new Date().toISOString()
  });
};

export const getPendingChanges = async () => {
  return getAllFromStore('pending');
};

export const clearPendingChanges = async () => {
  return clearStore('pending');
};

// Metadata
export const getLastSyncTime = async () => {
  const meta = await getFromStore('metadata', 'lastSync');
  return meta?.value || null;
};

export const setLastSyncTime = async (time) => {
  return putToStore('metadata', { key: 'lastSync', value: time });
};

// Bulk operations for sync
export const bulkSaveLists = async (lists) => {
  for (const list of lists) {
    await saveList(list);
  }
};

export const bulkSaveItems = async (items) => {
  for (const item of items) {
    await saveItem(item);
  }
};

// Clear all data
export const clearAllData = async () => {
  await clearStore('lists');
  await clearStore('items');
  await clearStore('pending');
  await clearStore('metadata');
};

// Export/Import
export const exportAllData = async (userId) => {
  const lists = await getLists(userId);
  const allItems = [];
  
  for (const list of lists) {
    const items = await getItems(list.id);
    allItems.push(...items);
  }
  
  return {
    lists,
    items: allItems,
    exported_at: new Date().toISOString()
  };
};

export const importAllData = async (data, userId) => {
  const { lists, items } = data;
  
  // Generate new IDs to avoid conflicts
  const listIdMap = {};
  
  for (const list of lists) {
    const oldId = list.id;
    const newId = `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    listIdMap[oldId] = newId;
    
    await saveList({
      ...list,
      id: newId,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
  }
  
  for (const item of items) {
    const newListId = listIdMap[item.list_id];
    if (newListId) {
      await saveItem({
        ...item,
        id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        list_id: newListId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  }
};
