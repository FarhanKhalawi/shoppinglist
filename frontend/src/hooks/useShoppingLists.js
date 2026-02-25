import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import * as db from '../lib/db';
import { useAuth } from '../contexts/AuthContext';

export function useShoppingLists() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const { user, isLocalMode } = useAuth();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchLists = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    try {
      if (isLocalMode || !isOnline) {
        // Load from IndexedDB
        const localLists = await db.getLists(user.user_id);
        setLists(localLists.sort((a, b) => 
          new Date(b.updated_at) - new Date(a.updated_at)
        ));
      } else {
        // Load from API
        const response = await api.get('/lists');
        const serverLists = response.data;
        
        // Save to IndexedDB
        await db.bulkSaveLists(serverLists);
        setLists(serverLists);
      }
    } catch (err) {
      // Fallback to IndexedDB on error
      try {
        const localLists = await db.getLists(user.user_id);
        setLists(localLists.sort((a, b) => 
          new Date(b.updated_at) - new Date(a.updated_at)
        ));
      } catch (dbErr) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [user, isLocalMode, isOnline]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const createList = async (name) => {
    const now = new Date().toISOString();
    const newList = {
      id: `list_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: user.user_id,
      name,
      created_at: now,
      updated_at: now
    };

    try {
      if (isLocalMode || !isOnline) {
        await db.saveList(newList);
        setLists(prev => [newList, ...prev]);
        return newList;
      } else {
        const response = await api.post('/lists', { name });
        const serverList = response.data;
        await db.saveList(serverList);
        setLists(prev => [serverList, ...prev]);
        return serverList;
      }
    } catch (err) {
      // Save locally on error
      await db.saveList(newList);
      await db.addPendingChange({ type: 'CREATE_LIST', data: newList });
      setLists(prev => [newList, ...prev]);
      return newList;
    }
  };

  const updateList = async (listId, updates) => {
    const list = lists.find(l => l.id === listId);
    if (!list) return;

    const updatedList = {
      ...list,
      ...updates,
      updated_at: new Date().toISOString()
    };

    try {
      if (isLocalMode || !isOnline) {
        await db.saveList(updatedList);
        setLists(prev => prev.map(l => l.id === listId ? updatedList : l));
        return updatedList;
      } else {
        const response = await api.put(`/lists/${listId}`, updates);
        const serverList = response.data;
        await db.saveList(serverList);
        setLists(prev => prev.map(l => l.id === listId ? serverList : l));
        return serverList;
      }
    } catch (err) {
      await db.saveList(updatedList);
      await db.addPendingChange({ type: 'UPDATE_LIST', data: updatedList });
      setLists(prev => prev.map(l => l.id === listId ? updatedList : l));
      return updatedList;
    }
  };

  const deleteList = async (listId) => {
    try {
      if (!isLocalMode && isOnline) {
        await api.delete(`/lists/${listId}`);
      }
      await db.deleteList(listId);
      setLists(prev => prev.filter(l => l.id !== listId));
    } catch (err) {
      await db.deleteList(listId);
      await db.addPendingChange({ type: 'DELETE_LIST', data: { id: listId } });
      setLists(prev => prev.filter(l => l.id !== listId));
    }
  };

  const syncData = async () => {
    if (isLocalMode || !isOnline || !user) return;

    setSyncing(true);
    try {
      const localLists = await db.getLists(user.user_id);
      const allItems = [];
      
      for (const list of localLists) {
        const items = await db.getItems(list.id);
        allItems.push(...items);
      }

      const response = await api.post('/sync', {
        lists: localLists,
        items: allItems,
        last_sync: await db.getLastSyncTime()
      });

      // Update local data with server response
      await db.bulkSaveLists(response.data.lists);
      await db.bulkSaveItems(response.data.items);
      await db.clearPendingChanges();
      await db.setLastSyncTime(response.data.synced_at);

      setLists(response.data.lists.sort((a, b) => 
        new Date(b.updated_at) - new Date(a.updated_at)
      ));
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  return {
    lists,
    loading,
    error,
    isOnline,
    syncing,
    createList,
    updateList,
    deleteList,
    syncData,
    refetch: fetchLists
  };
}

export function useListItems(listId) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { isLocalMode } = useAuth();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchItems = useCallback(async () => {
    if (!listId) return;
    
    setLoading(true);
    setError(null);

    try {
      if (isLocalMode || !isOnline) {
        const localItems = await db.getItems(listId);
        setItems(localItems.sort((a, b) => a.order - b.order));
      } else {
        const response = await api.get(`/lists/${listId}/items`);
        const serverItems = response.data;
        await db.bulkSaveItems(serverItems);
        setItems(serverItems);
      }
    } catch (err) {
      try {
        const localItems = await db.getItems(listId);
        setItems(localItems.sort((a, b) => a.order - b.order));
      } catch (dbErr) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [listId, isLocalMode, isOnline]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const addItem = async (itemData) => {
    const now = new Date().toISOString();
    const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.order)) + 1 : 0;
    
    const newItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      list_id: listId,
      name: itemData.name,
      quantity: itemData.quantity || null,
      unit: itemData.unit || null,
      category: itemData.category || null,
      note: itemData.note || null,
      is_done: false,
      priority: itemData.priority || null,
      order: maxOrder,
      created_at: now,
      updated_at: now
    };

    try {
      if (isLocalMode || !isOnline) {
        await db.saveItem(newItem);
        setItems(prev => [...prev, newItem]);
        return newItem;
      } else {
        const response = await api.post(`/lists/${listId}/items`, itemData);
        const serverItem = response.data;
        await db.saveItem(serverItem);
        setItems(prev => [...prev, serverItem]);
        return serverItem;
      }
    } catch (err) {
      await db.saveItem(newItem);
      await db.addPendingChange({ type: 'CREATE_ITEM', data: newItem });
      setItems(prev => [...prev, newItem]);
      return newItem;
    }
  };

  const updateItem = async (itemId, updates) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;

    const updatedItem = {
      ...item,
      ...updates,
      updated_at: new Date().toISOString()
    };

    try {
      if (isLocalMode || !isOnline) {
        await db.saveItem(updatedItem);
        setItems(prev => prev.map(i => i.id === itemId ? updatedItem : i));
        return updatedItem;
      } else {
        const response = await api.put(`/lists/${listId}/items/${itemId}`, updates);
        const serverItem = response.data;
        await db.saveItem(serverItem);
        setItems(prev => prev.map(i => i.id === itemId ? serverItem : i));
        return serverItem;
      }
    } catch (err) {
      await db.saveItem(updatedItem);
      await db.addPendingChange({ type: 'UPDATE_ITEM', data: updatedItem });
      setItems(prev => prev.map(i => i.id === itemId ? updatedItem : i));
      return updatedItem;
    }
  };

  const deleteItem = async (itemId) => {
    try {
      if (!isLocalMode && isOnline) {
        await api.delete(`/lists/${listId}/items/${itemId}`);
      }
      await db.deleteItem(itemId);
      setItems(prev => prev.filter(i => i.id !== itemId));
    } catch (err) {
      await db.deleteItem(itemId);
      await db.addPendingChange({ type: 'DELETE_ITEM', data: { id: itemId } });
      setItems(prev => prev.filter(i => i.id !== itemId));
    }
  };

  const toggleItem = async (itemId) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    return updateItem(itemId, { is_done: !item.is_done });
  };

  const markAllDone = async () => {
    try {
      if (!isLocalMode && isOnline) {
        await api.post(`/lists/${listId}/mark-all-done`);
      }
      
      const now = new Date().toISOString();
      const updatedItems = items.map(item => ({
        ...item,
        is_done: true,
        updated_at: now
      }));
      
      for (const item of updatedItems) {
        await db.saveItem(item);
      }
      
      setItems(updatedItems);
    } catch (err) {
      // Update locally
      const now = new Date().toISOString();
      const updatedItems = items.map(item => ({
        ...item,
        is_done: true,
        updated_at: now
      }));
      
      for (const item of updatedItems) {
        await db.saveItem(item);
      }
      
      setItems(updatedItems);
    }
  };

  const clearDone = async () => {
    const doneItems = items.filter(i => i.is_done);
    
    try {
      if (!isLocalMode && isOnline) {
        await api.post(`/lists/${listId}/clear-done`);
      }
      
      for (const item of doneItems) {
        await db.deleteItem(item.id);
      }
      
      setItems(prev => prev.filter(i => !i.is_done));
    } catch (err) {
      for (const item of doneItems) {
        await db.deleteItem(item.id);
      }
      setItems(prev => prev.filter(i => !i.is_done));
    }
  };

  const reorderItems = async (startIndex, endIndex) => {
    const reordered = Array.from(items);
    const [removed] = reordered.splice(startIndex, 1);
    reordered.splice(endIndex, 0, removed);
    
    const updatedItems = reordered.map((item, index) => ({
      ...item,
      order: index,
      updated_at: new Date().toISOString()
    }));
    
    setItems(updatedItems);
    
    for (const item of updatedItems) {
      await db.saveItem(item);
    }
  };

  return {
    items,
    loading,
    error,
    isOnline,
    addItem,
    updateItem,
    deleteItem,
    toggleItem,
    markAllDone,
    clearDone,
    reorderItems,
    refetch: fetchItems
  };
}
