import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  ar: {
    // App
    appName: 'قائمة التسوق',
    
    // Auth
    login: 'تسجيل الدخول',
    signup: 'إنشاء حساب',
    logout: 'تسجيل الخروج',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    name: 'الاسم',
    confirmPassword: 'تأكيد كلمة المرور',
    loginWithGoogle: 'الدخول عبر Google',
    orContinueWith: 'أو المتابعة باستخدام',
    dontHaveAccount: 'ليس لديك حساب؟',
    alreadyHaveAccount: 'لديك حساب؟',
    localMode: 'الوضع المحلي',
    localModeDesc: 'استخدم التطبيق بدون تسجيل دخول',
    
    // Validation
    emailRequired: 'البريد الإلكتروني مطلوب',
    emailInvalid: 'البريد الإلكتروني غير صالح',
    passwordRequired: 'كلمة المرور مطلوبة',
    passwordMin: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
    nameRequired: 'الاسم مطلوب',
    passwordMismatch: 'كلمات المرور غير متطابقة',
    
    // Lists
    myLists: 'قوائمي',
    newList: 'قائمة جديدة',
    createList: 'إنشاء قائمة',
    listName: 'اسم القائمة',
    enterListName: 'أدخل اسم القائمة',
    noLists: 'لا توجد قوائم بعد',
    noListsDesc: 'أنشئ قائمتك الأولى للبدء',
    deleteList: 'حذف القائمة',
    deleteListConfirm: 'هل أنت متأكد من حذف هذه القائمة؟ سيتم حذف جميع العناصر.',
    listDeleted: 'تم حذف القائمة',
    listCreated: 'تم إنشاء القائمة',
    listUpdated: 'تم تحديث القائمة',
    renameList: 'إعادة تسمية القائمة',
    
    // Items
    addItem: 'إضافة عنصر',
    itemName: 'اسم العنصر',
    enterItemName: 'أضف عنصراً...',
    quantity: 'الكمية',
    unit: 'الوحدة',
    category: 'التصنيف',
    note: 'ملاحظة',
    noItems: 'لا توجد عناصر',
    noItemsDesc: 'أضف عناصر إلى قائمتك',
    itemAdded: 'تم إضافة العنصر',
    itemUpdated: 'تم تحديث العنصر',
    itemDeleted: 'تم حذف العنصر',
    deleteItem: 'حذف العنصر',
    editItem: 'تعديل العنصر',
    markAsDone: 'تم الشراء',
    markAsUndone: 'لم يتم الشراء',
    
    // Categories
    categories: {
      fruits: 'فواكه',
      vegetables: 'خضروات',
      meat: 'لحوم',
      dairy: 'ألبان',
      bakery: 'مخبوزات',
      beverages: 'مشروبات',
      snacks: 'وجبات خفيفة',
      household: 'منزلية',
      personal: 'شخصية',
      other: 'أخرى'
    },
    
    // Units
    units: {
      kg: 'كجم',
      g: 'جرام',
      l: 'لتر',
      ml: 'مل',
      piece: 'قطعة',
      pack: 'عبوة',
      box: 'علبة',
      dozen: 'درزن'
    },
    
    // Filters
    all: 'الكل',
    notPurchased: 'غير مشتراة',
    purchased: 'مشتراة',
    search: 'بحث',
    searchInList: 'البحث في القائمة...',
    
    // Bulk actions
    markAllDone: 'تحديد الكل كمشتراة',
    clearPurchased: 'مسح المشتراة',
    allMarkedDone: 'تم تحديد جميع العناصر كمشتراة',
    purchasedCleared: 'تم مسح العناصر المشتراة',
    
    // Settings
    settings: 'الإعدادات',
    language: 'اللغة',
    theme: 'المظهر',
    lightMode: 'فاتح',
    darkMode: 'داكن',
    systemMode: 'النظام',
    exportData: 'تصدير البيانات',
    importData: 'استيراد البيانات',
    exportSuccess: 'تم تصدير البيانات بنجاح',
    importSuccess: 'تم استيراد البيانات بنجاح',
    selectFile: 'اختر ملف',
    
    // Sync
    syncing: 'جاري المزامنة...',
    synced: 'متزامن',
    offline: 'غير متصل',
    syncError: 'خطأ في المزامنة',
    
    // General
    save: 'حفظ',
    cancel: 'إلغاء',
    delete: 'حذف',
    edit: 'تعديل',
    close: 'إغلاق',
    confirm: 'تأكيد',
    back: 'رجوع',
    loading: 'جاري التحميل...',
    error: 'حدث خطأ',
    success: 'نجاح',
    items: 'عناصر',
    item: 'عنصر',
    
    // PWA
    installApp: 'تثبيت التطبيق',
    installPrompt: 'ثبت التطبيق للوصول السريع',
    
    // Welcome
    welcomeTitle: 'مرحباً بك في قائمة التسوق',
    welcomeDesc: 'نظم مشترياتك بسهولة وشاركها عبر جميع أجهزتك',
    getStarted: 'ابدأ الآن',
    features: {
      sync: 'مزامنة عبر الأجهزة',
      offline: 'يعمل بدون إنترنت',
      organize: 'تنظيم سهل'
    }
  },
  en: {
    // App
    appName: 'Shopping List',
    
    // Auth
    login: 'Login',
    signup: 'Sign Up',
    logout: 'Logout',
    email: 'Email',
    password: 'Password',
    name: 'Name',
    confirmPassword: 'Confirm Password',
    loginWithGoogle: 'Continue with Google',
    orContinueWith: 'Or continue with',
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: 'Already have an account?',
    localMode: 'Local Mode',
    localModeDesc: 'Use the app without signing in',
    
    // Validation
    emailRequired: 'Email is required',
    emailInvalid: 'Invalid email address',
    passwordRequired: 'Password is required',
    passwordMin: 'Password must be at least 6 characters',
    nameRequired: 'Name is required',
    passwordMismatch: 'Passwords do not match',
    
    // Lists
    myLists: 'My Lists',
    newList: 'New List',
    createList: 'Create List',
    listName: 'List Name',
    enterListName: 'Enter list name',
    noLists: 'No lists yet',
    noListsDesc: 'Create your first list to get started',
    deleteList: 'Delete List',
    deleteListConfirm: 'Are you sure you want to delete this list? All items will be deleted.',
    listDeleted: 'List deleted',
    listCreated: 'List created',
    listUpdated: 'List updated',
    renameList: 'Rename List',
    
    // Items
    addItem: 'Add Item',
    itemName: 'Item Name',
    enterItemName: 'Add an item...',
    quantity: 'Quantity',
    unit: 'Unit',
    category: 'Category',
    note: 'Note',
    noItems: 'No items',
    noItemsDesc: 'Add items to your list',
    itemAdded: 'Item added',
    itemUpdated: 'Item updated',
    itemDeleted: 'Item deleted',
    deleteItem: 'Delete Item',
    editItem: 'Edit Item',
    markAsDone: 'Mark as purchased',
    markAsUndone: 'Mark as not purchased',
    
    // Categories
    categories: {
      fruits: 'Fruits',
      vegetables: 'Vegetables',
      meat: 'Meat',
      dairy: 'Dairy',
      bakery: 'Bakery',
      beverages: 'Beverages',
      snacks: 'Snacks',
      household: 'Household',
      personal: 'Personal',
      other: 'Other'
    },
    
    // Units
    units: {
      kg: 'kg',
      g: 'g',
      l: 'L',
      ml: 'ml',
      piece: 'piece',
      pack: 'pack',
      box: 'box',
      dozen: 'dozen'
    },
    
    // Filters
    all: 'All',
    notPurchased: 'Not Purchased',
    purchased: 'Purchased',
    search: 'Search',
    searchInList: 'Search in list...',
    
    // Bulk actions
    markAllDone: 'Mark all as purchased',
    clearPurchased: 'Clear purchased',
    allMarkedDone: 'All items marked as purchased',
    purchasedCleared: 'Purchased items cleared',
    
    // Settings
    settings: 'Settings',
    language: 'Language',
    theme: 'Theme',
    lightMode: 'Light',
    darkMode: 'Dark',
    systemMode: 'System',
    exportData: 'Export Data',
    importData: 'Import Data',
    exportSuccess: 'Data exported successfully',
    importSuccess: 'Data imported successfully',
    selectFile: 'Select File',
    
    // Sync
    syncing: 'Syncing...',
    synced: 'Synced',
    offline: 'Offline',
    syncError: 'Sync error',
    
    // General
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    confirm: 'Confirm',
    back: 'Back',
    loading: 'Loading...',
    error: 'Error occurred',
    success: 'Success',
    items: 'items',
    item: 'item',
    
    // PWA
    installApp: 'Install App',
    installPrompt: 'Install the app for quick access',
    
    // Welcome
    welcomeTitle: 'Welcome to Shopping List',
    welcomeDesc: 'Organize your shopping easily and sync across all your devices',
    getStarted: 'Get Started',
    features: {
      sync: 'Sync across devices',
      offline: 'Works offline',
      organize: 'Easy organization'
    }
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved || 'ar';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key) => {
    const keys = key.split('.');
    let value = translations[language];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ar' ? 'en' : 'ar');
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
