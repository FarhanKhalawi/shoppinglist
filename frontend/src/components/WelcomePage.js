import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ShoppingCart, Wifi, WifiOff, RefreshCw, Cloud } from 'lucide-react';

export function WelcomePage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <div className="flex-1 relative overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: 'url(https://images.pexels.com/photos/7608269/pexels-photo-7608269.jpeg)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/70 to-background" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-end h-full px-6 pb-12 pt-20">
          {/* Logo */}
          <div className="mb-8 p-4 rounded-full bg-primary/10 backdrop-blur-sm">
            <ShoppingCart className="w-16 h-16 text-primary" />
          </div>
          
          {/* Title */}
          <h1 className="font-cairo text-4xl md:text-5xl font-bold text-center mb-4 text-foreground">
            {t('welcomeTitle')}
          </h1>
          
          {/* Description */}
          <p className="text-lg text-muted-foreground text-center max-w-md mb-8">
            {t('welcomeDesc')}
          </p>
          
          {/* Features */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <FeatureBadge icon={<Cloud className="w-4 h-4" />} text={t('features.sync')} />
            <FeatureBadge icon={<WifiOff className="w-4 h-4" />} text={t('features.offline')} />
            <FeatureBadge icon={<RefreshCw className="w-4 h-4" />} text={t('features.organize')} />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureBadge({ icon, text }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/80 backdrop-blur-sm">
      <span className="text-primary">{icon}</span>
      <span className="text-sm font-medium text-foreground">{text}</span>
    </div>
  );
}
