import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);

  const refreshCart = useCallback(async () => {
    try {
      const { data } = await api.get('/cart');
      setCart(data.data.cart);
    } catch {
      setCart([]);
    }
  }, []);

  useEffect(() => {
    api.get('/auth/me')
      .then(({ data }) => setUser(data.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user) refreshCart();
    else setCart([]);
  }, [user, refreshCart]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setUser(data.data.user);
    return data.data.user;
  };
  const register = async (payload) => {
    const { data } = await api.post('/auth/register', payload);
    setUser(data.data.user);
    return data.data.user;
  };
  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, cart, setCart, refreshCart, login, register, logout }}>
      {children}
    </Ctx.Provider>
  );
}
