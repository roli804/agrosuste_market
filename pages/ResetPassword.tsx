import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Logo from '../components/Logo';
import { Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  const pwdRules = {
    length: password.length >= 6,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };
  const pwdValid = Object.values(pwdRules).every(Boolean);
  const pwdStrength = Object.values(pwdRules).filter(Boolean).length;

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('access_token') || hash.includes('type=recovery')) {
      setHasToken(true);
    } else {
      supabase.auth.getSession().then(({ data }) => {
        if (data.session) setHasToken(true);
      });
    }
  }, []);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwdValid) { setError('A senha não cumpre os requisitos de segurança.'); return; }
    if (password !== confirm) { setError('As senhas não coincidem.'); return; }
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSuccess(true);
    setTimeout(() => navigate('/#/auth'), 2500);
  };

  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-12 text-center shadow-xl max-w-sm w-full space-y-6 border border-green-100">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={40} className="text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-[#1C1C1C]">Senha atualizada!</h2>
          <p className="text-gray-500 text-sm">A ser redirecionado para o login...</p>
        </div>
      </div>
    );
  }

  if (!hasToken) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-12 text-center shadow-xl max-w-sm w-full space-y-4 border border-amber-100">
          <div className="text-5xl">⚠️</div>
          <h2 className="text-xl font-bold text-[#1C1C1C]">Link inválido</h2>
          <p className="text-gray-500 text-sm">Este link de recuperação expirou ou é inválido. Por favor, solicite um novo link.</p>
          <button onClick={() => navigate('/#/auth')} className="btn-primary w-full py-3 mt-4">Ir para Login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center py-12 px-4 bg-[#F5F5F0] min-h-[80vh]">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        <div className="pt-10 pb-6 px-10 text-center border-b border-gray-50">
          <Logo className="w-10 h-10 mx-auto mb-4" color="#2E7D32" />
          <h2 className="text-2xl font-bold text-[#1C1C1C]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Definir nova senha
          </h2>
          <p className="text-gray-400 text-sm mt-1">Escolha uma nova senha segura para a sua conta.</p>
        </div>

        <form onSubmit={handleReset} className="p-8 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100 text-center font-medium">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-[#6D6D6D] uppercase">Nova Senha</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={`auth-input peer pr-12 ${password && !pwdValid ? 'border-amber-300' : password && pwdValid ? 'border-green-400' : ''}`}
                placeholder="Nova senha segura"
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2E7D32]">
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {password.length > 0 && (
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5 mt-2">
                <div className="flex gap-1 mb-2">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= pwdStrength ? (pwdStrength <= 2 ? 'bg-red-400' : pwdStrength <= 3 ? 'bg-amber-400' : 'bg-green-500') : 'bg-gray-200'}`} />
                  ))}
                </div>
                {[
                  { ok: pwdRules.length, label: 'Mínimo 6 caracteres' },
                  { ok: pwdRules.upper, label: 'Uma letra maiúscula' },
                  { ok: pwdRules.lower, label: 'Uma letra minúscula' },
                  { ok: pwdRules.number, label: 'Um número' },
                  { ok: pwdRules.symbol, label: 'Um símbolo (!@#...)' },
                ].map(r => (
                  <div key={r.label} className={`flex items-center gap-2 text-[11px] font-medium ${r.ok ? 'text-green-600' : 'text-gray-400'}`}>
                    <span>{r.ok ? '✅' : '○'}</span> {r.label}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[#6D6D6D] uppercase">Confirmar Senha</label>
            <input
              type="password"
              required
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className={`auth-input ${confirm && confirm !== password ? 'border-red-300' : confirm && confirm === password ? 'border-green-400' : ''}`}
              placeholder="Repetir nova senha"
            />
            {confirm && confirm !== password && (
              <p className="text-red-500 text-[11px] font-medium">As senhas não coincidem.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !pwdValid || password !== confirm}
            className="btn-primary w-full py-3 shadow-[0_4px_14px_rgba(27,94,32,0.25)] group disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? 'A atualizar...' : 'Atualizar Senha'}
            {!loading && <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&display=swap');
          .auth-input {
            width: 100%; height: 48px; padding: 14px 16px;
            border-radius: 10px; border: 1.5px solid #E5E7EB;
            background: #FAFAFA; font-size: 14px; font-weight: 500;
            color: #1C1C1C; outline: none; transition: all 0.2s;
          }
          .auth-input:focus { border-color: #2E7D32; box-shadow: 0 0 0 3px rgba(46,125,50,0.08); background: #fff; }
          .btn-primary {
            background: #1B5E20; color: white; border-radius: 10px;
            padding: 12px 24px; font-weight: 600; font-size: 15px;
            transition: all 0.3s; display: flex; align-items: center; justify-content: center;
          }
          .btn-primary:hover:not(:disabled) { background: #0D3B12; transform: translateY(-2px); }
        `}</style>
      </div>
    </div>
  );
};

export default ResetPassword;
