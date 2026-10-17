import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bus, Eye, EyeOff, ArrowRight } from 'lucide-react';

/**
 * Turn an axios failure into something a human can act on.
 *
 * Two very different failures used to collapse into one vague sentence:
 *   1. The API answered 4xx/5xx  -> show the exact status + backend message.
 *   2. No response at all (network / CORS / missing /api proxy) -> say so,
 *      and name the URL that was tried, instead of blaming the password.
 */
function describeLoginError(err) {
  const config = err?.config || {};
  const joined = `${config.baseURL || ''}${config.url || ''}`;
  const url = err?.request?.responseURL || (joined !== '' ? joined : '/api/auth/admin/login');

  if (err?.response) {
    const { status, data } = err.response;
    const body = typeof data === 'string' ? data.trim() : data;

    let detail;
    if (body && typeof body === 'object') {
      const parts = [];
      if (body.message) parts.push(String(body.message));
      else if (body.error) parts.push(String(body.error));
      else parts.push(JSON.stringify(body));
      if (body.code) parts.push(`code: ${body.code}`);
      detail = parts.join(' · ');
    } else if (body) {
      // Non-JSON body (e.g. an nginx 404/405 page or the SPA index.html)
      detail = body.slice(0, 200).replace(/\s+/g, ' ');
    } else {
      detail = 'empty response body';
    }

    return {
      title: `Request rejected — HTTP ${status}`,
      detail: `${detail}\nPOST ${url}`,
    };
  }

  // Not an axios error (e.g. thrown after the response came back, such as a
  // 200 without a token payload). Report it verbatim.
  if (!err?.request && !err?.config) {
    return {
      title: 'Login failed',
      detail: `${err?.message || 'Unknown error'}\nPOST ${url}`,
    };
  }

  // err.response is undefined: the request never completed.
  const reason = err?.code || err?.message || 'Unknown error';
  const hint =
    err?.code === 'ECONNABORTED'
      ? 'The request timed out before the API answered.'
      : 'No response was received — the API is unreachable from this page. Check the /api reverse-proxy location, CORS, or VITE_API_BASE_URL. This is not a wrong-password error.';
  return {
    title: `Request failed — no response from server`,
    detail: `${reason} · ${hint}\nPOST ${url}`,
  };
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      console.error('[admin-login] failed:', err?.response || err);
      setError(describeLoginError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-xl mb-4 shadow-lg shadow-emerald-500/30">
            <Bus className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">CoU Bus Tracker</h1>
          <p className="text-gray-500 text-sm mt-1">Admin Panel</p>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">Sign In</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 px-4 py-3 rounded-lg mb-4 text-sm">
              <p className="font-semibold text-red-700">{error.title}</p>
              <pre className="mt-1.5 whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed text-red-600">
                {error.detail}
              </pre>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition"
                placeholder="admin@cou.ac.bd"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">
          Comilla University CSE Batch 16
        </p>
      </div>
    </div>
  );
}
