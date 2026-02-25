import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import { ShoppingCart, Mail, Lock, User, Loader2, WifiOff } from 'lucide-react';

export function AuthPage() {
  const { t } = useLanguage();
  const { login, register, loginWithGoogle, enableLocalMode } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginErrors, setLoginErrors] = useState({});

  // Register form state
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registerErrors, setRegisterErrors] = useState({});

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!loginEmail) {
      errors.email = t('emailRequired');
    } else if (!validateEmail(loginEmail)) {
      errors.email = t('emailInvalid');
    }

    if (!loginPassword) {
      errors.password = t('passwordRequired');
    }

    setLoginErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      await login(loginEmail, loginPassword);
      toast.success(t('success'));
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!registerName) {
      errors.name = t('nameRequired');
    }

    if (!registerEmail) {
      errors.email = t('emailRequired');
    } else if (!validateEmail(registerEmail)) {
      errors.email = t('emailInvalid');
    }

    if (!registerPassword) {
      errors.password = t('passwordRequired');
    } else if (registerPassword.length < 6) {
      errors.password = t('passwordMin');
    }

    if (registerPassword !== registerConfirmPassword) {
      errors.confirmPassword = t('passwordMismatch');
    }

    setRegisterErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      await register(registerEmail, registerPassword, registerName);
      toast.success(t('success'));
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || t('error'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    loginWithGoogle();
  };

  const handleLocalMode = () => {
    enableLocalMode();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-3">
        <div className="p-3 rounded-full bg-primary/10">
          <ShoppingCart className="w-8 h-8 text-primary" />
        </div>
        <h1 className="font-cairo text-2xl font-bold text-foreground">{t('appName')}</h1>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="font-cairo text-2xl">
            {activeTab === 'login' ? t('login') : t('signup')}
          </CardTitle>
          <CardDescription>
            {activeTab === 'login' ? t('dontHaveAccount') : t('alreadyHaveAccount')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login" data-testid="login-tab">{t('login')}</TabsTrigger>
              <TabsTrigger value="signup" data-testid="signup-tab">{t('signup')}</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">{t('email')}</Label>
                  <div className="relative">
                    <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder={t('email')}
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="ps-10"
                      data-testid="login-email-input"
                    />
                  </div>
                  {loginErrors.email && (
                    <p className="text-sm text-destructive">{loginErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">{t('password')}</Label>
                  <div className="relative">
                    <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder={t('password')}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="ps-10"
                      data-testid="login-password-input"
                    />
                  </div>
                  {loginErrors.password && (
                    <p className="text-sm text-destructive">{loginErrors.password}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={loading} data-testid="login-submit-btn">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('login')}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">{t('name')}</Label>
                  <div className="relative">
                    <User className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="register-name"
                      type="text"
                      placeholder={t('name')}
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      className="ps-10"
                      data-testid="register-name-input"
                    />
                  </div>
                  {registerErrors.name && (
                    <p className="text-sm text-destructive">{registerErrors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-email">{t('email')}</Label>
                  <div className="relative">
                    <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="register-email"
                      type="email"
                      placeholder={t('email')}
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      className="ps-10"
                      data-testid="register-email-input"
                    />
                  </div>
                  {registerErrors.email && (
                    <p className="text-sm text-destructive">{registerErrors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password">{t('password')}</Label>
                  <div className="relative">
                    <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="register-password"
                      type="password"
                      placeholder={t('password')}
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className="ps-10"
                      data-testid="register-password-input"
                    />
                  </div>
                  {registerErrors.password && (
                    <p className="text-sm text-destructive">{registerErrors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-confirm-password">{t('confirmPassword')}</Label>
                  <div className="relative">
                    <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="register-confirm-password"
                      type="password"
                      placeholder={t('confirmPassword')}
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      className="ps-10"
                      data-testid="register-confirm-password-input"
                    />
                  </div>
                  {registerErrors.confirmPassword && (
                    <p className="text-sm text-destructive">{registerErrors.confirmPassword}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={loading} data-testid="register-submit-btn">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('signup')}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">{t('orContinueWith')}</span>
            </div>
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleLogin}
              data-testid="google-login-btn"
            >
              <svg className="w-5 h-5 me-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {t('loginWithGoogle')}
            </Button>

            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={handleLocalMode}
              data-testid="local-mode-btn"
            >
              <WifiOff className="w-4 h-4 me-2" />
              {t('localMode')}
            </Button>
            <p className="text-xs text-center text-muted-foreground">{t('localModeDesc')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
