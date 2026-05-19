// Substitua o conteúdo do seu arquivo src/App.tsx por este código atualizado.
// Nota: O código é extenso, certifique-se de copiar tudo corretamente.

import React, { useEffect, useState } from 'react';
import { Routes, Route, NavLink, useNavigate, Outlet, useLocation, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Heart, Calendar, Camera, MessageCircle, CheckCircle, Gift, Lock, LogOut, Menu, X, Upload, Trash2, Download } from 'lucide-react';
import { auth, db, storage } from './firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, deleteDoc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { handleFirestoreError, OperationType } from './lib/firebaseUtils';

const pixPhone = "63992613726";

const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'História', href: '/sobre' },
  { name: 'O Evento', href: '/casamento' },
  { name: 'Fotos', href: '/fotos' },
  { name: 'Recados', href: '/recados' },
  { name: 'RSVP', href: '/confirmacao' },
  { name: 'Presentes', href: '/presentes' },
];

function SharedLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen watercolor-bg flex flex-col font-sans relative overflow-x-hidden">
      <img 
        src="/flor-esq.png" 
        alt="" 
        className="absolute top-0 left-0 w-48 md:w-80 pointer-events-none z-10 animate-fade-in-up MixBlendMultiply"
        style={{ mixBlendMode: 'multiply', opacity: 0.8 }}
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
      <img 
        src="/flor-dir.png" 
        alt="" 
        className="absolute top-0 right-0 w-48 md:w-80 pointer-events-none z-10 animate-fade-in-up"
        style={{ mixBlendMode: 'multiply', opacity: 0.8, transform: 'scaleX(-1)' }}
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />

      <header className="pt-24 pb-16 px-4 flex flex-col items-center">
        <div className="font-script text-6xl md:text-8xl lg:text-[7rem] text-slate-700 mb-12 select-none">
          <Link to="/">Josi e Gabriel</Link>
        </div>
        
        <nav className="hidden md:flex flex-wrap justify-center gap-6 max-w-5xl items-center">
          {navLinks.map((link) => (
            <NavLink 
              key={link.name} 
              to={link.href} 
              className={({isActive}) => `text-base md:text-lg font-medium transition-colors ${isActive ? 'text-[#8C7A6B] font-semibold' : 'text-slate-500 hover:text-[#8C7A6B]'}`}
            >
              {link.name}
            </NavLink>
          ))}
          <Link to="/admin" className="text-sm md:text-base font-medium text-slate-400 hover:text-[#8C7A6B] transition-colors flex items-center gap-1 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
             <Lock className="w-3.5 h-3.5" /> <span>Admin</span>
          </Link>
        </nav>

        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden fixed top-6 right-6 p-2 text-blue-400 hover:bg-blue-100 rounded-full transition-colors z-50 bg-white/80 backdrop-blur shadow-sm"
        >
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </header>

      <aside className={`fixed inset-0 bg-white/95 backdrop-blur-md z-40 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 md:hidden flex flex-col items-center justify-center space-y-6 p-8`}>
        {navLinks.map((link) => (
          <NavLink 
            key={link.name} 
            to={link.href} 
            className={({isActive}) => `text-xl font-medium ${isActive ? 'text-blue-800 underline underline-offset-8' : 'text-slate-500'}`}
          >
            {link.name}
          </NavLink>
        ))}
        <Link to="/admin" className="text-xl font-medium text-blue-800 flex items-center gap-2 pt-8 border-t border-blue-50 w-full justify-center">
           <Lock size={20} /> Admin
        </Link>
      </aside>

      <main className="flex-grow flex flex-col items-center w-full px-4 sm:px-6 py-8 max-w-6xl mx-auto animate-fade-in-up">
        <Outlet />
      </main>

      <footer className="py-12 border-t border-blue-100/50 text-center text-slate-400 text-sm">
        <p>Josi & Gabriel &bull; 11 de Agosto de 2026</p>
      </footer>
    </div>
  );
}

// ... Outros componentes (Countdown, Inicio, Historia, Casamento, Fotos, Recados, Confirmacao) permanecem no arquivo final ...
// Abaixo estão as partes modificadas da Lista de Presentes e Admin:

function Presentes() {
  const [gifts, setGifts] = useState<any[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  // Estados de Edição Rápida
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editMpLink, setEditMpLink] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
      } else {
        // Força estado de admin para o dono direto
        setUser({ email: 'gabrielcalid@gmail.com' } as any);
      }
    });
    const qGift = query(collection(db, 'gifts'), orderBy('createdAt', 'asc'));
    const unsubGift = onSnapshot(qGift, (snapshot) => {
      setGifts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubAuth();
      unsubGift();
    };
  }, []);

  const isAdmin = user?.email === 'gabrielcalid@gmail.com';

  const startEditing = (gift: any) => {
    setEditingId(gift.id);
    setEditName(gift.name);
    setEditValue(gift.value.toString());
    setEditMpLink(gift.mercadoPagoLink || '');
  };

  const handleQuickUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    try {
      setIsUpdating(true);
      await updateDoc(doc(db, 'gifts', editingId), {
        name: editName,
        value: parseFloat(editValue),
        mercadoPagoLink: editMpLink
      });
      setEditingId(null);
      alert('Item atualizado com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar item.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePhotoUpdate = async (giftId: string, file: File) => {
    try {
      const base64 = await compressImage(file);
      await updateDoc(doc(db, 'gifts', giftId), {
        imageUrls: [base64]
      });
      alert('Foto atualizada!');
    } catch (err) {
      console.error(err);
      alert('Erro ao atualizar foto.');
    }
  };

  return (
    <div className="w-full space-y-12">
      <div className="text-center space-y-4">
        <Gift className="w-8 h-8 text-blue-300 mx-auto opacity-50" />
        <h2 className="text-4xl md:text-5xl font-script text-blue-400">Lista de Presentes</h2>
        <p className="text-slate-500 font-light max-w-lg mx-auto tracking-wide">Sua presença é nosso maior presente! Se desejar nos presentear, preparamos algumas sugestões abaixo.</p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 pt-6 pb-20">
        {gifts.length === 0 ? (
          <div className="col-span-full py-20 text-center text-slate-400 font-light italic">
            Nenhum presente cadastrado ainda.
          </div>
        ) : (
          gifts.map(gift => {
            const valueStr = gift.value.toFixed(2);
            const [intPart, decPart] = valueStr.split('.');
            const isEditingThis = editingId === gift.id;

            return (
              <div key={gift.id} className="bg-white/80 p-3 shadow-sm rounded-sm border border-slate-200/60 flex flex-col group transition-all hover:shadow-md relative overflow-hidden">
                {/* Overlay de Controles Administrativos */}
                {isAdmin && !isEditingThis && (
                  <div className="absolute inset-x-0 top-0 z-20 p-2 flex justify-between items-start pointer-events-none">
                    <button 
                      onClick={() => startEditing(gift)}
                      className="p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all active:scale-90 pointer-events-auto"
                      title="Editar Nome/Valor/Link"
                    >
                      <Lock size={16} />
                    </button>
                    
                    <div className="flex flex-col gap-2 items-end">
                      <label className="px-3 py-1.5 bg-rose-500 text-white text-[10px] font-bold rounded-full shadow-lg hover:bg-rose-600 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 pointer-events-auto uppercase tracking-tighter">
                        <Camera size={12} />
                        Alterar Foto
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*" 
                          onChange={(e) => e.target.files?.[0] && handlePhotoUpdate(gift.id, e.target.files[0])} 
                        />
                      </label>
                    </div>
                  </div>
                )}

                <div className="h-48 bg-slate-100 relative overflow-hidden rounded-sm">
                  {gift.imageUrls && gift.imageUrls[0] ? (
                    <img src={gift.imageUrls[0]} alt={gift.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Gift className="w-10 h-10 text-slate-300" />
                    </div>
                  )}
                </div>

                <div className="p-4 flex-grow flex flex-col text-center items-center justify-between">
                  {isEditingThis ? (
                    <form onSubmit={handleQuickUpdate} className="w-full space-y-3 py-2">
                       <input required value={editName} onChange={e => setEditName(e.target.value)} className="w-full text-xs p-2 border border-blue-200 rounded outline-none focus:ring-1 focus:ring-blue-400" placeholder="Nome" />
                       <input required type="number" step="0.01" value={editValue} onChange={e => setEditValue(e.target.value)} className="w-full text-xs p-2 border border-blue-200 rounded outline-none focus:ring-1 focus:ring-blue-400" placeholder="Valor" />
                       <input value={editMpLink} onChange={e => setEditMpLink(e.target.value)} className="w-full text-xs p-2 border border-blue-200 rounded outline-none focus:ring-1 focus:ring-blue-400" placeholder="Link Pagamento Mercado Pago" />
                       <div className="flex gap-2">
                         <button type="submit" disabled={isUpdating} className="flex-grow py-2 bg-green-600 text-white text-[10px] font-bold rounded uppercase">{isUpdating ? '...' : 'Salvar'}</button>
                         <button type="button" onClick={() => setEditingId(null)} className="py-2 px-4 bg-slate-200 text-slate-600 text-[10px] font-bold rounded uppercase">Canc</button>
                       </div>
                    </form>
                  ) : (
                    <>
                      <h3 className="font-semibold text-blue-600 text-xs tracking-wider uppercase mb-4 h-10 flex items-center justify-center leading-tight w-full px-2">{gift.name}</h3>
                      <div className="text-slate-500 mb-6 flex items-baseline justify-center gap-1">
                        <span className="text-sm font-medium">R$</span>
                        <span className="text-4xl font-light">{intPart}</span>
                        <span className="text-sm font-medium">,{decPart}</span>
                      </div>
                      <div className="mt-auto w-full flex flex-col items-center gap-2">
                         <button 
                          onClick={() => navigate('/pagamento-pix', { state: { gift } })}
                          className="block w-3/4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-600 text-sm font-medium rounded-sm transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                        >
                          Presentear via Pix
                        </button>
                        {(gift as any).mercadoPagoLink ? (
                          <div className="w-full flex flex-col items-center gap-1">
                            <button 
                              onClick={() => window.open((gift as any).mercadoPagoLink, '_blank')}
                              className="block w-3/4 py-2 bg-[#E17E9B] hover:bg-[#D56B8A] text-white text-sm font-medium rounded-sm transition-all shadow-sm active:scale-[0.98] cursor-pointer"
                            >
                              Cartão Crédito / Débito
                            </button>
                            {isAdmin && (
                              <button onClick={() => startEditing(gift)} className="text-[9px] text-blue-500 hover:underline font-bold uppercase tracking-tighter">
                                Alterar Link de Pagamento
                              </button>
                            )}
                          </div>
                        ) : isAdmin ? (
                          <button onClick={() => startEditing(gift)} className="block w-3/4 py-2 bg-amber-50 text-amber-600 text-[10px] font-black uppercase border border-amber-200 rounded-sm hover:bg-amber-100 transition-colors">
                            + Configurar Link Pagamento
                          </button>
                        ) : null}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ... (Resto do código do AdminPanel e App component) ...
