# نظام الدردشة العربي

نظام دردشة متكامل مبني بـ PHP و SQLite مع واجهة مستخدم عربية.

## المميزات
- تسجيل الدخول وإنشاء حساب
- دخول كزائر
- غرف دردشة عامة وخاصة
- مشاركة الملفات (صور، فيديو، مستندات)
- قائمة المستخدمين المتصلين
- تصميم متجاوب بالكامل

## متطلبات التشغيل
- PHP 7.4 أو أحدث
- SQLite3
- خادم ويب (Apache/Nginx)

## التثبيت
1. قم بنسخ المستودع
```bash
git clone https://github.com/username/chat-system.git
```

2. قم بضبط صلاحيات المجلدات
```bash
chmod 777 database
chmod 777 uploads
```

3. افتح المتصفح وانتقل إلى عنوان الموقع

## هيكل المشروع
```
chat-system/
├── api/                # واجهات برمجة التطبيق
├── assets/            # ملفات CSS و JavaScript
├── auth/              # صفحات المصادقة
├── config/            # ملفات الإعداد
├── database/          # قاعدة البيانات
├── includes/          # الملفات المشتركة
├── uploads/           # الملفات المرفوعة
└── index.php          # الصفحة الرئيسية
```

## المساهمة
نرحب بمساهماتكم! يرجى اتباع الخطوات التالية:
1. Fork المستودع
2. إنشاء فرع جديد (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'إضافة ميزة جديدة'`)
4. Push إلى الفرع (`git push origin feature/amazing-feature`)
5. فتح Pull Request

## الترخيص
MIT License