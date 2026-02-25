import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import * as db from '../lib/db';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import {
  ArrowRight,
  ArrowLeft,
  Moon,
  Sun,
  Monitor,
  Globe,
  Download,
  Upload,
  LogOut,
  User,
  ShoppingCart
} from 'lucide-react';

export function Settings() {
  const navigate = useNavigate();
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { user, logout, isLocalMode } = useAuth();
  const fileInputRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      let data;
      if (isLocalMode) {
        data = await db.exportAllData(user.user_id);
      } else {
        const response = await api.get('/export');
        data = response.data;
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shopping-list-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(t('exportSuccess'));
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (isLocalMode) {
        await db.importAllData(data, user.user_id);
      } else {
        await api.post('/import', data);
      }

      toast.success(t('importSuccess'));
      // Refresh the page to show imported data
      window.location.reload();
    } catch (error) {
      toast.error(t('error'));
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/welcome');
  };

  const BackIcon = language === 'ar' ? ArrowRight : ArrowLeft;

  const themeOptions = [
    { value: 'light', label: t('lightMode'), icon: Sun },
    { value: 'dark', label: t('darkMode'), icon: Moon },
    { value: 'system', label: t('systemMode'), icon: Monitor },
  ];

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-border safe-area-inset-top">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
            data-testid="back-btn"
          >
            <BackIcon className="w-5 h-5" />
          </Button>
          <h1 className="font-cairo text-xl font-bold text-foreground">{t('settings')}</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* User Info */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                {user?.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <User className="w-8 h-8 text-primary" />
                )}
              </div>
              <div>
                <CardTitle className="font-cairo text-lg">{user?.name || 'Local User'}</CardTitle>
                <CardDescription>
                  {user?.email || (isLocalMode ? t('localMode') : '')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="font-cairo text-lg flex items-center gap-2">
              <Sun className="w-5 h-5" />
              {t('theme')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  variant={theme === value ? 'default' : 'outline'}
                  className="flex flex-col gap-2 h-auto py-4"
                  onClick={() => setTheme(value)}
                  data-testid={`theme-${value}-btn`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Language */}
        <Card>
          <CardHeader>
            <CardTitle className="font-cairo text-lg flex items-center gap-2">
              <Globe className="w-5 h-5" />
              {t('language')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger data-testid="language-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">العربية</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Data */}
        <Card>
          <CardHeader>
            <CardTitle className="font-cairo text-lg flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              {t('exportData')} / {t('importData')}
            </CardTitle>
            <CardDescription>
              {language === 'ar' 
                ? 'قم بتصدير أو استيراد بياناتك لنقلها بين الأجهزة'
                : 'Export or import your data to transfer between devices'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleExport}
                disabled={exporting}
                data-testid="export-data-btn"
              >
                <Download className="w-4 h-4 me-2" />
                {exporting ? t('loading') : t('exportData')}
              </Button>

              <Button
                variant="outline"
                className="flex-1"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                data-testid="import-data-btn"
              >
                <Upload className="w-4 h-4 me-2" />
                {importing ? t('loading') : t('importData')}
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>

        {/* Logout */}
        <Card>
          <CardContent className="pt-6">
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleLogout}
              data-testid="logout-btn"
            >
              <LogOut className="w-4 h-4 me-2" />
              {t('logout')}
            </Button>
          </CardContent>
        </Card>

        {/* App Info */}
        <div className="text-center text-sm text-muted-foreground py-4">
          <p>قائمة التسوق v1.0.0</p>
          <p className="mt-1">Made with ❤️</p>
        </div>
      </main>
    </div>
  );
}
