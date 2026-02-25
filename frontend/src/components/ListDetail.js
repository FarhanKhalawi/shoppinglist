import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useListItems } from '../hooks/useShoppingLists';
import { api } from '../lib/api';
import * as db from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import {
  ArrowRight,
  ArrowLeft,
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  Check,
  CheckCheck,
  X,
  Search,
  Loader2,
  ShoppingBag,
  Package,
  ScanBarcode
} from 'lucide-react';
import { BarcodeScanner } from './BarcodeScanner';

const CATEGORIES = [
  'fruits', 'vegetables', 'meat', 'dairy', 'bakery',
  'beverages', 'snacks', 'household', 'personal', 'other'
];

const UNITS = ['kg', 'g', 'l', 'ml', 'piece', 'pack', 'box', 'dozen'];

export function ListDetail() {
  const { listId } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { isLocalMode } = useAuth();
  const inputRef = useRef(null);

  const {
    items,
    loading,
    isOnline,
    addItem,
    updateItem,
    deleteItem,
    toggleItem,
    markAllDone,
    clearDone
  } = useListItems(listId);

  const [listName, setListName] = useState('');
  const [newItemName, setNewItemName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [showSearch, setShowSearch] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editNote, setEditNote] = useState('');

  // Fetch list name
  useEffect(() => {
    const fetchList = async () => {
      try {
        if (isLocalMode || !isOnline) {
          const list = await db.getList(listId);
          setListName(list?.name || '');
        } else {
          const response = await api.get(`/lists/${listId}`);
          setListName(response.data.name);
        }
      } catch (error) {
        console.error('Error fetching list:', error);
      }
    };
    fetchList();
  }, [listId, isLocalMode, isOnline]);

  // Focus input on mount
  useEffect(() => {
    if (inputRef.current && !loading) {
      inputRef.current.focus();
    }
  }, [loading]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    try {
      await addItem({ name: newItemName.trim() });
      toast.success(t('itemAdded'));
      setNewItemName('');
      inputRef.current?.focus();
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const handleToggleItem = async (itemId) => {
    try {
      await toggleItem(itemId);
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const handleMarkAllDone = async () => {
    try {
      await markAllDone();
      toast.success(t('allMarkedDone'));
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const handleClearDone = async () => {
    try {
      await clearDone();
      toast.success(t('purchasedCleared'));
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const openEditDialog = (item) => {
    setSelectedItem(item);
    setEditName(item.name);
    setEditQuantity(item.quantity?.toString() || '');
    setEditUnit(item.unit || '');
    setEditCategory(item.category || '');
    setEditNote(item.note || '');
    setShowEditDialog(true);
  };

  const handleEditItem = async () => {
    if (!selectedItem || !editName.trim()) return;

    try {
      await updateItem(selectedItem.id, {
        name: editName.trim(),
        quantity: editQuantity ? parseFloat(editQuantity) : null,
        unit: editUnit || null,
        category: editCategory || null,
        note: editNote || null
      });
      toast.success(t('itemUpdated'));
      setShowEditDialog(false);
      setSelectedItem(null);
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const openDeleteDialog = (item) => {
    setSelectedItem(item);
    setShowDeleteDialog(true);
  };

  const handleDeleteItem = async () => {
    if (!selectedItem) return;

    try {
      await deleteItem(selectedItem.id);
      toast.success(t('itemDeleted'));
      setShowDeleteDialog(false);
      setSelectedItem(null);
    } catch (error) {
      toast.error(t('error'));
    }
  };

  // Filter and search items
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'purchased' && item.is_done) ||
      (filter === 'notPurchased' && !item.is_done);
    return matchesSearch && matchesFilter;
  });

  const purchasedCount = items.filter((i) => i.is_done).length;
  const totalCount = items.length;

  const BackIcon = language === 'ar' ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border safe-area-inset-top">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
                data-testid="back-btn"
              >
                <BackIcon className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="font-cairo text-xl font-bold text-foreground">{listName}</h1>
                <p className="text-xs text-muted-foreground">
                  {purchasedCount}/{totalCount} {t('items')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSearch(!showSearch)}
                data-testid="search-toggle-btn"
              >
                <Search className="w-5 h-5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" data-testid="list-actions-menu">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleMarkAllDone} data-testid="mark-all-done-btn">
                    <CheckCheck className="w-4 h-4 me-2" />
                    {t('markAllDone')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleClearDone} data-testid="clear-done-btn">
                    <X className="w-4 h-4 me-2" />
                    {t('clearPurchased')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Search Bar */}
          {showSearch && (
            <div className="animate-slide-up">
              <Input
                placeholder={t('searchInList')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mb-3"
                autoFocus
                data-testid="search-input"
              />
            </div>
          )}

          {/* Filters */}
          <Tabs value={filter} onValueChange={setFilter} className="w-full">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="all" data-testid="filter-all">{t('all')}</TabsTrigger>
              <TabsTrigger value="notPurchased" data-testid="filter-not-purchased">{t('notPurchased')}</TabsTrigger>
              <TabsTrigger value="purchased" data-testid="filter-purchased">{t('purchased')}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">{t('loading')}</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="w-24 h-24 mb-6 rounded-full bg-secondary/50 flex items-center justify-center">
              <Package className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="font-cairo text-lg font-semibold text-foreground mb-2">
              {searchQuery ? t('noItems') : t('noItems')}
            </h2>
            <p className="text-muted-foreground text-center">
              {t('noItemsDesc')}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item, index) => (
              <Card
                key={item.id}
                className={`p-4 animate-slide-up transition-all ${
                  item.is_done ? 'opacity-60' : ''
                }`}
                style={{ animationDelay: `${index * 30}ms` }}
                data-testid={`item-card-${item.id}`}
              >
                <div className="flex items-start gap-4">
                  <Checkbox
                    checked={item.is_done}
                    onCheckedChange={() => handleToggleItem(item.id)}
                    className="mt-1 size-6 rounded-full checkbox-animate"
                    data-testid={`item-checkbox-${item.id}`}
                  />

                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => openEditDialog(item)}
                  >
                    <p
                      className={`font-medium text-foreground ${
                        item.is_done ? 'line-through text-muted-foreground' : ''
                      }`}
                    >
                      {item.name}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {item.quantity && (
                        <Badge variant="secondary" className="text-xs">
                          {item.quantity} {item.unit ? t(`units.${item.unit}`) : ''}
                        </Badge>
                      )}
                      {item.category && (
                        <Badge variant="outline" className="text-xs">
                          {t(`categories.${item.category}`)}
                        </Badge>
                      )}
                    </div>

                    {item.note && (
                      <p className="text-sm text-muted-foreground mt-2 truncate">
                        {item.note}
                      </p>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0" data-testid={`item-menu-${item.id}`}>
                        <MoreVertical className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(item)} data-testid={`edit-item-${item.id}`}>
                        <Edit2 className="w-4 h-4 me-2" />
                        {t('edit')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => openDeleteDialog(item)}
                        className="text-destructive focus:text-destructive"
                        data-testid={`delete-item-${item.id}`}
                      >
                        <Trash2 className="w-4 h-4 me-2" />
                        {t('delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Quick Add Bar */}
      <div className="fixed bottom-0 inset-x-0 glass border-t border-border safe-area-inset-bottom z-40">
        <form onSubmit={handleAddItem} className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex gap-3">
            <Input
              ref={inputRef}
              placeholder={t('enterItemName')}
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="flex-1 h-12 text-lg"
              data-testid="quick-add-input"
            />
            <Button type="submit" size="lg" className="h-12 px-6" data-testid="quick-add-btn">
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </form>
      </div>

      {/* Edit Item Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-cairo">{t('editItem')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('itemName')}</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                data-testid="edit-item-name-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">{t('quantity')}</label>
                <Input
                  type="number"
                  step="any"
                  value={editQuantity}
                  onChange={(e) => setEditQuantity(e.target.value)}
                  data-testid="edit-item-quantity-input"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">{t('unit')}</label>
                <Select value={editUnit} onValueChange={setEditUnit}>
                  <SelectTrigger data-testid="edit-item-unit-select">
                    <SelectValue placeholder={t('unit')} />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {t(`units.${unit}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('category')}</label>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger data-testid="edit-item-category-select">
                  <SelectValue placeholder={t('category')} />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {t(`categories.${cat}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">{t('note')}</label>
              <Input
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                placeholder={t('note')}
                data-testid="edit-item-note-input"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleEditItem} data-testid="edit-item-save-btn">
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Item Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-cairo">{t('deleteItem')}</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedItem?.name}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="delete-item-confirm-btn"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
