'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../lib/api/auth';
import { useRouter } from 'next/navigation';

export const LoginModal: React.FC = () => {
  const router = useRouter();
  const { isLoginModalOpen, closeLoginModal, loginSuccess, redirectAfterLogin } = useAuth();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  if (!isLoginModalOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleaned = phone.trim().replace(/\D/g, '');
    if (cleaned.length !== 10) {
      setErrorMsg('कृपया 10 अंकों का वैध भारतीय मोबाइल नंबर दर्ज करें');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.sendOtp(cleaned);
      setCooldown(res.cooldownSeconds || 60);
      setStep('otp');
      // Dev hint for testing
      setDevOtpHint('कंसोल अथवा बैकएंड टर्मिनल से OTP देखकर भरें');
    } catch (err: any) {
      setErrorMsg(err.message || 'OTP भेजने में त्रुटि हुई। कृपया पुनः प्रयास करें।');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);

    // Auto move to next input
    if (digit && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-input-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const fullOtp = otp.join('');
    if (fullOtp.length !== 6) {
      setErrorMsg('कृपया 6 अंकों का OTP दर्ज करें');
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.verifyOtp(phone.trim(), fullOtp);
      loginSuccess(res.user);

      if (redirectAfterLogin) {
        router.push(redirectAfterLogin);
      } else if (res.user.role === 'owner' || res.user.role === 'staff') {
        router.push('/admin');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'अमान्य OTP। कृपया दोबारा जांचें।');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('phone');
    setPhone('');
    setOtp(['', '', '', '', '', '']);
    setErrorMsg(null);
    closeLoginModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          id="close-login-modal-btn"
          className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface w-8 h-8 rounded-full bg-surface-container flex items-center justify-center transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Modal Header */}
        <div className="bg-surface-container-low p-6 pb-5 text-center border-b border-surface-container">
          <div className="w-14 h-14 rounded-2xl bg-primary text-on-primary flex items-center justify-center mx-auto mb-3 shadow">
            <span className="material-symbols-outlined text-[32px]">phonelink_lock</span>
          </div>
          <h2 className="font-headline-md text-headline-md font-bold text-primary">
            {step === 'phone' ? 'किसान लॉगिन / खाता प्रवेश' : 'OTP सत्यापन'}
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            {step === 'phone'
              ? 'खाता लॉगिन व ऑर्डर ट्रैकिंग हेतु मोबाइल नंबर दर्ज करें'
              : `+91 ${phone} पर भेजा गया 6-अंकीय कोड दर्ज करें`}
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-error-container text-on-error-container font-label-sm text-label-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Dev OTP Hint */}
        {devOtpHint && step === 'otp' && (
          <div className="mx-6 mt-2 p-2 rounded-lg bg-secondary-fixed/50 text-on-secondary-fixed-variant font-code-md text-xs flex items-center justify-between">
            <span>ℹ️ Dev Mode: OTP टर्मिनल लॉग में उपलब्ध है</span>
          </div>
        )}

        {/* Step 1: Phone Input Form */}
        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-label-md text-label-md text-on-surface font-bold">
                मोबाइल नंबर (10-Digit Mobile Number)
              </label>
              <div className="flex items-center bg-surface-container-low rounded-xl px-3 border border-outline-variant/40 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <span className="font-code-md text-code-md font-bold text-on-surface-variant pr-2 border-r border-outline-variant/30">
                  +91
                </span>
                <input
                  id="login-phone-input"
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="98765 43210"
                  autoFocus
                  required
                  className="w-full h-12 bg-transparent px-3 font-headline-md text-headline-md text-on-surface outline-none placeholder:text-outline/60"
                />
              </div>
            </div>

            <button
              id="send-otp-submit-btn"
              type="submit"
              disabled={loading || phone.length !== 10}
              className="h-12 w-full bg-primary text-on-primary hover:bg-primary-container font-label-lg text-label-lg font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                  <span>OTP भेजा जा रहा है...</span>
                </>
              ) : (
                <>
                  <span>OTP प्राप्त करें</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </>
              )}
            </button>

            <p className="font-label-sm text-xs text-center text-on-surface-variant">
              पंजीकरण की आवश्यकता नहीं है। OTP सत्यापन पर नया खाता स्वतः सक्रिय हो जाता है।
            </p>
          </form>
        )}

        {/* Step 2: OTP Verification Form */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="p-6 flex flex-col gap-5">
            <div className="flex flex-col gap-2 items-center">
              <label className="font-label-md text-label-md text-on-surface font-bold text-center">
                6-अंकीय सुरक्षा कोड दर्ज करें
              </label>
              <div className="flex items-center gap-2 justify-center">
                {otp.map((val, idx) => (
                  <input
                    key={idx}
                    id={`otp-input-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={val}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    autoFocus={idx === 0}
                    className="w-12 h-14 text-center font-headline-xl text-headline-xl font-bold bg-surface-container-low border border-outline-variant/50 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                ))}
              </div>
            </div>

            <button
              id="verify-otp-submit-btn"
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              className="h-12 w-full bg-primary text-on-primary hover:bg-primary-container font-label-lg text-label-lg font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
                  <span>सत्यापित किया जा रहा है...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">verified</span>
                  <span>सत्यापित करें व प्रवेश करें</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-xs pt-1">
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="hover:text-primary transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">edit</span>
                नंबर बदलें
              </button>

              {cooldown > 0 ? (
                <span>पुनः भेजें: {cooldown}s</span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="text-primary font-bold hover:underline"
                >
                  OTP पुनः भेजें (Resend OTP)
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
