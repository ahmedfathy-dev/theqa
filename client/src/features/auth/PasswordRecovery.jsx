import { useState } from 'react';
import { localData } from '../../localData.js';
import { AuthLayout, Button, ButtonLink, Field, FormError, PasswordInput, useAction } from '../../components/ui.jsx';

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export default function PasswordRecovery({ role }) {
  const isAdmin = role === 'admin';
  const loginPath = '/login';
  const route = isAdmin ? '/admin/password-reset' : '/client/password-reset';
  const confirmRoute = `${route}/confirm`;
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [demoCode, setDemoCode] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const { busy, err, run } = useAction();

  const sendCode = async () => {
    let response;
    const success = await run(async () => {
      response = await localData(route, { method: 'POST', body: { email } });
    }, 'تم إرسال رمز الاستعادة');
    if (success) {
      setDemoCode(response.resetCode);
      setCode('');
      setStep('reset');
      setValidationError('');
    }
  };

  const requestReset = async (event) => {
    event.preventDefault();
    if (!isEmail(email)) {
      setValidationError('أدخل بريدًا إلكترونيًا صحيحًا.');
      return;
    }
    await sendCode();
  };

  const confirmReset = async (event) => {
    event.preventDefault();
    setValidationError('');
    if (!/^\d{6}$/.test(code)) {
      setValidationError('أدخل رمز الاستعادة المكوّن من 6 أرقام.');
      return;
    }
    if (password.length < 8) {
      setValidationError('يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.');
      return;
    }
    if (password !== confirmPassword) {
      setValidationError('كلمتا المرور غير متطابقتين.');
      return;
    }
    if (await run(() => localData(confirmRoute, { method: 'POST', body: { email, code, password } }), 'تم تحديث كلمة المرور')) {
      setStep('done');
    }
  };

  return (
    <AuthLayout
      brand={isAdmin ? 'مساحة الفريق' : 'بوابة المشاريع'}
      heading={step === 'done' ? 'تم تغيير كلمة المرور' : 'استعادة كلمة المرور'}
      description={step === 'email'
        ? 'أدخل البريد الإلكتروني المرتبط بحسابك.'
        : step === 'reset'
          ? 'أنشئ كلمة مرور جديدة لحسابك.'
          : 'تم تحديث بيانات الدخول.'}
      points={['استعادة آمنة بخطوات واضحة', 'رمز صالح لمدة 10 دقائق', 'الرابط والرمز تجريبيان في هذه النسخة المحلية']}
      notice={step !== 'email' && step !== 'done' ? 'إذا كان البريد مرتبطًا بحساب، فستجد رمز الاستعادة في صندوق البريد التجريبي أدناه.' : null}
      onSubmit={step === 'email' ? requestReset : confirmReset}
    >
      {step === 'email' && (
        <>
          <Field label="البريد الإلكتروني" error={validationError || err}>
            <input
              type="email"
              className="ltr"
              dir="ltr"
              autoFocus
              autoComplete="email"
              required
              value={email}
              onChange={(event) => { setEmail(event.target.value); setValidationError(''); }}
              placeholder="name@example.com"
            />
          </Field>
          <Button block loading={busy}>إرسال رمز الاستعادة</Button>
        </>
      )}

      {step === 'reset' && (
        <>
          <Field label="البريد الإلكتروني">
            <input type="email" className="ltr" dir="ltr" value={email} readOnly />
          </Field>
          {demoCode && (
            <div className="demo-reset-code" role="status" aria-live="polite">
              <span>رمز البريد التجريبي</span>
              <bdi dir="ltr" className="tnum">{demoCode}</bdi>
              <small>للاختبار المحلي فقط — لا يُرسل بريد حقيقي.</small>
            </div>
          )}
          <Field label="رمز الاستعادة">
            <input
              type="text"
              className="ltr tnum"
              dir="ltr"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              autoFocus
              required
              value={code}
              onChange={(event) => { setCode(event.target.value.replace(/\D/g, '').slice(0, 6)); setValidationError(''); }}
              placeholder="123456"
            />
          </Field>
          <Field label="كلمة المرور الجديدة">
            <PasswordInput autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
          </Field>
          <Field label="تأكيد كلمة المرور">
            <PasswordInput autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={(event) => { setConfirmPassword(event.target.value); setValidationError(''); }} />
          </Field>
          <FormError message={validationError || err} />
          <Button block loading={busy}>حفظ كلمة المرور الجديدة</Button>
          <Button type="button" variant="ghost" size="small" block disabled={busy} onClick={sendCode}>إعادة إرسال الرمز</Button>
        </>
      )}

      {step === 'done' && (
        <>
          <p className="notice" role="status">يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.</p>
          <ButtonLink to={loginPath} block>العودة لتسجيل الدخول</ButtonLink>
        </>
      )}

      {step !== 'done' && (
        <ButtonLink to={loginPath} variant="ghost" size="small" block>العودة لتسجيل الدخول</ButtonLink>
      )}
    </AuthLayout>
  );
}
