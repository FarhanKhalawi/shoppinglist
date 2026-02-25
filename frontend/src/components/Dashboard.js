import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useShoppingLists } from '../hooks/useShoppingLists';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { toast } from 'sonner';
import {
  Plus,
  ShoppingCart,
  MoreVertical,
  Edit2,
  Trash2,
  RefreshCw,
  Wifi,
  WifiOff,
  Settings,
  Loader2,
  ClipboardList,
  AlertTriangle
} from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';

export function Dashboard() {
  const { t, language } = useLanguage();
  const { user, isLocalMode } = useAuth();
  const navigate = useNavigate();
  const { lists, loading, isOnline, syncing, createList, updateList, deleteList, syncData } = useShoppingLists();

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedList, setSelectedList] = useState(null);
  const [newListName, setNewListName] = useState('');
  const [renameListName, setRenameListName] = useState('');

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    
    try {
      await createList(newListName.trim());
      toast.success(t('listCreated'));
      setShowCreateDialog(false);
      setNewListName('');
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const handleRenameList = async () => {
    if (!renameListName.trim() || !selectedList) return;
    
    try {
      await updateList(selectedList.id, { name: renameListName.trim() });
      toast.success(t('listUpdated'));
      setShowRenameDialog(false);
      setRenameListName('');
      setSelectedList(null);
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const handleDeleteList = async () => {
    if (!selectedList) return;
    
    try {
      await deleteList(selectedList.id);
      toast.success(t('listDeleted'));
      setShowDeleteDialog(false);
      setSelectedList(null);
    } catch (error) {
      toast.error(t('error'));
    }
  };

  const openRenameDialog = (list) => {
    setSelectedList(list);
    setRenameListName(list.name);
    setShowRenameDialog(true);
  };

  const openDeleteDialog = (list) => {
    setSelectedList(list);
    setShowDeleteDialog(true);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border safe-area-inset-top">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <ShoppingCart className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-cairo text-xl font-bold text-foreground">{t('myLists')}</h1>
              <p className="text-xs text-muted-foreground">
                {user?.name || 'Local User'}
                {isLocalMode && <span className="ms-1">({t('localMode')})</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sync Status */}
            <div className="flex items-center gap-1 text-sm">
              {syncing ? (
                <RefreshCw className="w-4 h-4 animate-spin text-primary" />
              ) : isOnline ? (
                <Wifi className="w-4 h-4 text-primary" />
              ) : (
                <WifiOff className="w-4 h-4 text-muted-foreground" />
              )}
            </div>

            {/* Sync Button */}
            {!isLocalMode && isOnline && (
              <Button
                variant="ghost"
                size="icon"
                onClick={syncData}
                disabled={syncing}
                data-testid="sync-btn"
              >
                <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
              </Button>
            )}

            {/* Settings */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/settings')}
              data-testid="settings-btn"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        {/* Local Mode Warning */}
        {isLocalMode && (
          <Alert className="mb-6 border-yellow-500/50 bg-yellow-500/10">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-700 dark:text-yellow-400">
              {language === 'ar' 
                ? 'أنت في الوضع المحلي. البيانات محفوظة على هذا الجهاز فقط ولن تتم مزامنتها. سجّل الدخول لمزامنة بياناتك عبر الأجهزة.'
                : 'You are in local mode. Data is saved on this device only and will not sync. Sign in to sync your data across devices.'}
            </AlertDescription>
          </Alert>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">{t('loading')}</p>
          </div>
        ) : lists.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="w-32 h-32 mb-6 rounded-full bg-secondary/50 flex items-center justify-center">
              <ClipboardList className="w-16 h-16 text-muted-foreground" />
            </div>
            <h2 className="font-cairo text-xl font-semibold text-foreground mb-2">
              {t('noLists')}
            </h2>
            <p className="text-muted-foreground text-center mb-6">
              {t('noListsDesc')}
            </p>
            <Button onClick={() => setShowCreateDialog(true)} data-testid="create-first-list-btn">
              <Plus className="w-4 h-4 me-2" />
              {t('newList')}
            </Button>
          </div>
        ) : (
          /* Lists Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lists.map((list, index) => (
              <Card
                key={list.id}
                className="p-4 cursor-pointer hover:shadow-lg transition-all animate-slide-up touch-feedback"
                style={{ animationDelay: `${index * 50}ms` }}
                onClick={() => navigate(`/list/${list.id}`)}
                data-testid={`list-card-${list.id}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-cairo text-lg font-semibold text-foreground truncate">
                      {list.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDate(list.updated_at)}
                    </p>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="shrink-0" data-testid={`list-menu-${list.id}`}>
                        <MoreVertical className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          openRenameDialog(list);
                        }}
                        data-testid={`rename-list-${list.id}`}
                      >
                        <Edit2 className="w-4 h-4 me-2" />
                        {t('renameList')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteDialog(list);
                        }}
                        className="text-destructive focus:text-destructive"
                        data-testid={`delete-list-${list.id}`}
                      >
                        <Trash2 className="w-4 h-4 me-2" />
                        {t('deleteList')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* FAB */}
      <Button
        className="fixed bottom-6 end-6 size-14 rounded-full shadow-lg z-50"
        onClick={() => setShowCreateDialog(true)}
        data-testid="create-list-fab"
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Create List Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-cairo">{t('newList')}</DialogTitle>
            <DialogDescription>{t('enterListName')}</DialogDescription>
          </DialogHeader>
          <Input
            placeholder={t('listName')}
            value={newListName}
            onChange={(e) => setNewListName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateList()}
            autoFocus
            data-testid="new-list-name-input"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleCreateList} data-testid="create-list-confirm-btn">
              {t('createList')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename List Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-cairo">{t('renameList')}</DialogTitle>
          </DialogHeader>
          <Input
            placeholder={t('listName')}
            value={renameListName}
            onChange={(e) => setRenameListName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRenameList()}
            autoFocus
            data-testid="rename-list-input"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              {t('cancel')}
            </Button>
            <Button onClick={handleRenameList} data-testid="rename-list-confirm-btn">
              {t('save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete List Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-cairo">{t('deleteList')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteListConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteList}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="delete-list-confirm-btn"
            >
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
