import React, { useEffect, useState } from 'react';
import { Routes, Route, NavLink, useNavigate, Outlet, useLocation, Link } from 'react-router-dom';
import { Heart, Calendar, Camera, MessageCircle, CheckCircle, Gift, Lock, LogOut, Menu, X, Upload } from 'lucide-react';
import { auth, db, storage } from './firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { handleFirestoreError, OperationType } from './lib/firebaseUtils';

const pixPhone = "63992613726";

const navLinks = [
  { name: 'Início', href: '/' },
  { name: 'Nossa História', href: '/sobre' },
  { name: 'O Casamento', href: '/casamento' },
  { name: 'Fotos', href: '/fotos' },
  { name: 'Deixe seu Recado', href: '/recados' },
  { name: 'Confirmação', href: '/confirmacao' },
  { name: 'Lista de Presentes', href: '/presentes' },
];

function SharedLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-blue-50/30 text-slate-800 font-sans">
      {/* Mobile Menu Button */}
      <button 
        onClick={() => setIsMenuOpen(!isMenuOpen)} 
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white/90 backdrop-blur-md rounded-lg shadow-sm text-blue-900 hover:bg-blue-50 focus:outline-none"
      >
        <span className="sr-only">Abrir menu</span>
        {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay for mobile */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-blue-900/20 backdrop-blur-sm z-30 md:hidden" onClick={() => setIsMenuOpen(false)} />
      )}

      {/* Sidebar Navigation */}
      <nav className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-[4px_0_24px_rgba(0,0,0,0.02)] transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col border-r border-blue-50 overflow-y-auto`}>
        <div className="p-8 flex flex-col min-h-full">
          <div className="font-serif text-4xl text-blue-900 font-medium text-center mb-10 mt-8 md:mt-0">
            <Link to="/">J & G</Link>
          </div>
          <div className="flex flex-col space-y-2 flex-grow">
            {navLinks.map((link) => (
              <NavLink 
                key={link.name} 
                to={link.href} 
                className={({isActive}) => `px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 ${isActive ? 'bg-blue-100 text-blue-900' : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50'}`}
              >
                {link.name}
              </NavLink>
            ))}
          </div>
          <div className="mt-8 pt-8 border-t border-blue-50 text-center space-y-4">
            <p className="text-xs text-slate-400">13 de Agosto de 2026</p>
            <Link to="/admin" className="text-xs text-blue-400 hover:text-blue-600 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" /> Acesso Restrito
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 w-full md:ml-64 flex flex-col relative min-h-screen">
        <main className="flex-grow flex flex-col items-center justify-center w-full px-4 sm:px-6 py-16 md:py-24 max-w-4xl mx-auto animate-fade-in-up">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Countdown() {
  const targetDate = new Date('2026-08-13T00:00:00').getTime();
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) return null;

  return (
    <div className="flex gap-3 sm:gap-6 justify-center mt-12 bg-white/40 backdrop-blur-md p-6 sm:p-8 rounded-[2rem] border border-blue-100 shadow-sm max-w-md mx-auto">
      <div className="flex flex-col items-center min-w-[60px]">
        <span className="text-3xl sm:text-4xl font-serif text-blue-900 font-bold">{timeLeft.days}</span>
        <span className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-500 font-medium">Dias</span>
      </div>
      <div className="text-3xl font-serif text-blue-200 mt-[-2px]">:</div>
      <div className="flex flex-col items-center min-w-[60px]">
        <span className="text-3xl sm:text-4xl font-serif text-blue-900 font-bold">{timeLeft.hours.toString().padStart(2, '0')}</span>
        <span className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-500 font-medium">Horas</span>
      </div>
      <div className="text-3xl font-serif text-blue-200 mt-[-2px] uppercase">:</div>
      <div className="flex flex-col items-center min-w-[60px]">
        <span className="text-3xl sm:text-4xl font-serif text-blue-900 font-bold">{timeLeft.minutes.toString().padStart(2, '0')}</span>
        <span className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-500 font-medium">Mins</span>
      </div>
      <div className="text-3xl font-serif text-blue-200 mt-[-2px]">:</div>
      <div className="flex flex-col items-center min-w-[60px]">
        <span className="text-3xl sm:text-4xl font-serif text-blue-900 font-bold">{timeLeft.seconds.toString().padStart(2, '0')}</span>
        <span className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-500 font-medium">Segs</span>
      </div>
    </div>
  );
}

function Inicio() {
  return (
    <div className="text-center w-full">
      <Heart className="w-16 h-16 text-blue-500 mx-auto mb-6 opacity-80" />
      <h1 className="text-5xl md:text-7xl font-serif text-blue-900 mb-4 drop-shadow-sm">Josi & Gabriel</h1>
      <p className="text-xl md:text-2xl text-blue-700 tracking-wider">13 . 08 . 2026</p>
      <Countdown />
    </div>
  );
}

function Historia() {
  return (
    <div className="w-full space-y-8 bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-blue-100 text-center">
      <h2 className="text-3xl font-serif text-blue-900 flex items-center justify-center gap-3">
        <Heart className="w-6 h-6 text-blue-400" />
        Nossa História
        <Heart className="w-6 h-6 text-blue-400" />
      </h2>
      <div className="space-y-6 text-slate-600 leading-relaxed text-lg max-w-3xl mx-auto text-left">
        <p>Nossa história começou muito antes do nosso primeiro encontro. Deus, em Sua bondade, escreveu cada detalhe do nosso caminho e nos uniu no tempo certo.</p>
        <p>Uma certeza silenciosa de que deveria mandar uma mensagem, e aquela simples atitude mudou completamente nossas vidas.</p>
        <p>Antes mesmo de qualquer promessa, já sentindo um pequeno pedaço do que viria da conexão inesperada, veio a decisão: orar juntos.</p>
        <p>Em poucos dias, percebemos que compartilhamos muito mais do que gostos parecidos. Sonhamos parecido, acreditamos nas mesmas coisas, desejamos o mesmo futuro e carregamos os mesmos princípios no coração.</p>
        <p>Cada conversa se tornava mais longa. A oração nos fortalecia, a sinceridade nos aproximava e o cuidado conquistava diariamente. Entre chamadas de vídeo no fim do dia, estudos da Bíblia, risadas, perguntas profundas e planos para o futuro, fomos entendendo que o amor também nasce na amizade, na admiração e na presença constante.</p>
        <p>O primeiro encontro foi inesquecível. Parecia que o coração já reconhecia alguém que esperou por muito tempo. Cada abraço trouxe paz, cada olhar transmitia carinho e cada momento parecia confirmar aquilo que Deus já havia colocado em nossos corações.</p>
        <p>Hoje olhamos para trás com gratidão por cada detalhe da nossa caminhada. Nada foi por acaso. Deus conduziu nossa história com amor, propósito e cuidado.</p>
        <p className="font-medium text-blue-800 text-center italic mt-8 pt-6 border-t border-blue-50">"E agora, diante de uma nova etapa, seguimos escolhendo um ao outro todos os dias, construindo sonhos, fortalecendo nossa fé e colocando Deus sempre no centro de tudo aquilo que ainda iremos viver juntos."</p>
      </div>
    </div>
  );
}

function Casamento() {
  return (
    <div className="w-full space-y-8 text-center bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-blue-100">
      <h2 className="text-3xl font-serif text-blue-900 flex items-center justify-center gap-3">
        <Calendar className="w-7 h-7 text-blue-500" />
        O Casamento
      </h2>
      <div className="aspect-video w-full max-w-2xl mx-auto bg-blue-50 rounded-2xl overflow-hidden flex items-center justify-center border-2 border-dashed border-blue-200">
        <div className="text-center text-blue-400">
          <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Espaço para Foto / Convite</p>
        </div>
      </div>
    </div>
  );
}

function Fotos() {
  return (
    <div className="w-full space-y-8 text-center bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-blue-100">
      <h2 className="text-3xl font-serif text-blue-900 flex items-center justify-center gap-3">
        <Camera className="w-7 h-7 text-blue-500" />
        Fotos
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="aspect-square bg-blue-50 rounded-xl flex items-center justify-center overflow-hidden border border-blue-100">
            <span className="text-blue-300">Foto {i}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Recados() {
  const [messages, setMessages] = useState<any[]>([]);
  const [msgName, setMsgName] = useState('');
  const [msgPhone, setMsgPhone] = useState('');
  const [msgText, setMsgText] = useState('');

  useEffect(() => {
    const qMsg = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));
    const unsubMsg = onSnapshot(qMsg, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'messages'));

    return () => unsubMsg();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgName || !msgText) return;
    try {
      await addDoc(collection(db, 'messages'), {
        name: msgName,
        phone: msgPhone || '',
        text: msgText,
        createdAt: serverTimestamp()
      });
      setMsgName('');
      setMsgPhone('');
      setMsgText('');
      alert('Mensagem enviada com sucesso!');
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'messages');
    }
  };

  return (
    <div className="w-full space-y-8 max-w-2xl mx-auto">
      <h2 className="text-3xl font-serif text-center text-blue-900 flex items-center justify-center gap-3">
        <MessageCircle className="w-7 h-7 text-blue-500" />
        Deixe seu Recado
      </h2>
      <form onSubmit={handleSendMessage} className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-blue-100 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
          <input required type="text" value={msgName} onChange={e => setMsgName(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-blue-200 bg-blue-50/50 focus:bg-white focus:ring-2 focus:ring-blue-400 outline-none transition-all" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Telefone / WhatsApp</label>
          <input type="text" value={msgPhone} onChange={e => setMsgPhone(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-blue-200 bg-blue-50/50 focus:bg-white focus:ring-2 focus:ring-blue-400 outline-none transition-all" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Mensagem</label>
          <textarea required value={msgText} onChange={e => setMsgText(e.target.value)} rows={4} className="w-full px-4 py-2 rounded-lg border border-blue-200 bg-blue-50/50 focus:bg-white focus:ring-2 focus:ring-blue-400 outline-none transition-all resize-none"></textarea>
        </div>
        <button type="submit" className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors cursor-pointer">Enviar Recado</button>
      </form>

      {messages.length > 0 && (
        <div className="space-y-4 mt-8">
          <h3 className="text-xl font-medium text-blue-800 text-center mb-6">Mural de Recados</h3>
          <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
            {messages.map((msg) => (
              <div key={msg.id} className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100">
                <p className="text-slate-700 mb-2">{msg.text}</p>
                <p className="text-sm text-blue-600 font-medium">- {msg.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Confirmacao() {
  const [rsvpName, setRsvpName] = useState('');
  const [rsvpPhone, setRsvpPhone] = useState('');

  const handleSendRsvp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName || !rsvpPhone) return;
    try {
      await addDoc(collection(db, 'rsvps'), {
        name: rsvpName,
        phone: rsvpPhone,
        createdAt: serverTimestamp()
      });
      setRsvpName('');
      setRsvpPhone('');
      alert('Presença confirmada!');
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, 'rsvps');
    }
  };

  return (
    <div className="w-full space-y-8 max-w-xl mx-auto">
      <h2 className="text-3xl font-serif text-center text-blue-900 flex items-center justify-center gap-3">
        <CheckCircle className="w-7 h-7 text-blue-500" />
        Confirmação de Presença
      </h2>
      <p className="text-center text-slate-600">Por favor, confirme sua presença para nos ajudar na organização.</p>
      <form onSubmit={handleSendRsvp} className="bg-blue-600 p-6 md:p-8 rounded-3xl shadow-md space-y-4 text-white">
        <div>
          <label className="block text-sm font-medium text-blue-100 mb-1">Nome Completo</label>
          <input required type="text" value={rsvpName} onChange={e => setRsvpName(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-blue-700/50 text-white placeholder-blue-300 border-transparent focus:bg-blue-700 focus:ring-2 focus:ring-blue-300 outline-none transition-all" />
        </div>
        <div>
          <label className="block text-sm font-medium text-blue-100 mb-1">Telefone</label>
          <input required type="text" value={rsvpPhone} onChange={e => setRsvpPhone(e.target.value)} className="w-full px-4 py-3 rounded-lg bg-blue-700/50 text-white placeholder-blue-300 border-transparent focus:bg-blue-700 focus:ring-2 focus:ring-blue-300 outline-none transition-all" />
        </div>
        <button type="submit" className="w-full py-3 mt-4 bg-white text-blue-600 hover:bg-blue-50 font-semibold rounded-lg transition-colors cursor-pointer">Confirmar Presença</button>
      </form>
    </div>
  );
}

function Presentes() {
  const [gifts, setGifts] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const qGift = query(collection(db, 'gifts'), orderBy('createdAt', 'asc'));
    const unsubGift = onSnapshot(qGift, (snapshot) => {
      setGifts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'gifts'));

    return () => unsubGift();
  }, []);

  return (
    <div className="w-full space-y-8">
      <h2 className="text-3xl font-serif text-center text-blue-900 flex items-center justify-center gap-3">
        <Gift className="w-7 h-7 text-blue-500" />
        Lista de Presentes
      </h2>
      <p className="text-center text-slate-600 max-w-lg mx-auto">Sua presença é nosso maior presente! Mas se desejar nos abençoar com algo mais, preparamos algumas opções de presentes no valor para nos ajudar neste começo.</p>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
        {gifts.map(gift => (
          <div key={gift.id} className="bg-white rounded-2xl shadow-sm border border-blue-100 overflow-hidden flex flex-col">
            <div className="h-48 bg-blue-50 relative flex items-center justify-center">
              {gift.imageUrls && gift.imageUrls[0] ? (
                <img src={gift.imageUrls[0]} alt={gift.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <Gift className="w-12 h-12 text-blue-200" />
              )}
            </div>
            <div className="p-6 flex-grow flex flex-col">
              <h3 className="font-medium text-lg text-slate-800 mb-2">{gift.name}</h3>
              <p className="text-blue-600 font-semibold text-xl mb-6">R$ {gift.value.toFixed(2)}</p>
              <button 
                onClick={() => navigate('/pagamento-pix', { state: { gift } })}
                className="mt-auto block w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-center font-medium rounded-lg transition-colors cursor-pointer">
                Presentear com Pix
              </button>
            </div>
          </div>
        ))}
        
        {gifts.length === 0 && (
          <div className="col-span-full py-12 text-center text-blue-400 bg-white shadow-sm rounded-2xl border border-blue-100">
            A lista de presentes está sendo preparada.
          </div>
        )}
      </div>
    </div>
  );
}

function PagamentoPix() {
  const location = useLocation();
  const navigate = useNavigate();
  const gift = location.state?.gift;

  if (!gift) {
    return (
      <div className="p-8 text-center mt-20 w-full space-y-4">
        <p className="text-slate-600 text-lg">Nenhum presente selecionado.</p>
        <button onClick={() => navigate('/presentes')} className="text-blue-600 underline font-medium cursor-pointer">Voltar para a lista</button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-8 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-blue-100 text-center relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-2 bg-blue-500"></div>
      
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center shadow-sm border border-blue-100">
          <Gift className="w-8 h-8" />
        </div>
      </div>
      
      <h2 className="text-2xl font-serif text-blue-900">Pagamento Pix</h2>
      
      <div className="bg-blue-50 p-6 rounded-2xl space-y-3 shadow-inner">
        <p className="text-slate-600 text-sm font-medium uppercase tracking-wider">Você escolheu:</p>
        <p className="text-xl font-medium text-slate-800">{gift.name}</p>
        <p className="text-4xl font-semibold text-blue-600 tracking-tight">R$ {gift.value.toFixed(2)}</p>
      </div>
      
      <div className="space-y-5 text-left border border-slate-100 p-5 rounded-2xl">
        <p className="text-slate-700 font-semibold border-b border-slate-100 pb-3 flex items-center gap-2">
          <span className="bg-slate-800 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span> 
          Instruções
        </p>
        <ul className="text-slate-600 space-y-3 text-sm list-disc list-inside px-1">
          <li>Abra o aplicativo do seu banco.</li>
          <li>Escolha a opção Pix (Transferência).</li>
          <li>Insira a chave celular e o valor exato acima.</li>
          <li>Confira os dados e conclua o pagamento.</li>
        </ul>
        
        <div className="mt-4 flex flex-col items-center">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-2">Chave Celular</span>
          <div className="bg-slate-100 w-full py-3 rounded-xl font-mono text-xl font-bold text-slate-800 tracking-widest text-center border border-slate-200">
            {pixPhone}
          </div>
        </div>
        
        <button 
          onClick={() => {
            navigator.clipboard.writeText(pixPhone);
            alert("Chave Pix copiada com sucesso!");
          }}
          className="w-full py-3 mt-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors cursor-pointer shadow-sm active:scale-[0.98]"
        >
          Copiar Chave Pix
        </button>
      </div>

      <div className="pt-2">
        <p className="text-sm text-slate-500 mb-6 italic">Agradecemos de coração pelo seu presente! ❤️</p>
        <button onClick={() => navigate('/presentes')} className="text-blue-500 hover:text-blue-700 font-medium cursor-pointer flex items-center justify-center gap-2 mx-auto">
          &larr; Voltar para a lista
        </button>
      </div>
    </div>
  );
}

// --- Admin Panel ---
function AdminPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [rsvps, setRsvps] = useState<any[]>([]);
  const [gifts, setGifts] = useState<any[]>([]);

  // Gift Form
  const [giftName, setGiftName] = useState('');
  const [giftValue, setGiftValue] = useState('');
  const [giftFiles, setGiftFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    // Listen RSVPs
    const qRsvp = query(collection(db, 'rsvps'), orderBy('createdAt', 'desc'));
    const unsubRsvp = onSnapshot(qRsvp, (snapshot) => {
      setRsvps(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'rsvps'));

    // Listen Gifts
    const qGift = query(collection(db, 'gifts'), orderBy('createdAt', 'desc'));
    const unsubGift = onSnapshot(qGift, (snapshot) => {
      setGifts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => handleFirestoreError(error, OperationType.GET, 'gifts'));

    return () => {
      unsubRsvp();
      unsubGift();
    }
  }, [user]);

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error(e);
      alert('Erro ao fazer login. Tente novamente / abra em nova aba.');
    }
  }

  const logout = async () => {
    await signOut(auth);
    navigate('/');
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).slice(0, 3); // max 3
      setGiftFiles(files);
    }
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compress to 70% quality JPEG
        };
        img.onerror = (error) => reject(error);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleAddGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftName || !giftValue) return;

    try {
      setIsUploading(true);
      const imageUrls: string[] = [];

      for (const file of giftFiles) {
        try {
          const base64 = await compressImage(file);
          imageUrls.push(base64);
        } catch (e) {
          console.error("Erro ao processar imagem", e);
        }
      }

      await addDoc(collection(db, 'gifts'), {
        name: giftName,
        value: parseFloat(giftValue),
        imageUrls: imageUrls,
        createdAt: serverTimestamp()
      });
      
      setGiftName('');
      setGiftValue('');
      setGiftFiles([]);
      alert('Presente adicionado!');
    } catch (error) {
      console.error(error);
      alert('Erro ao adicionar presente. Verifique se a foto não é muito grande.');
    } finally {
      setIsUploading(false);
    }
  }

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const handleDeleteGift = async (id: string) => {
    if (!id) return;
    
    // Custom confirmation logic to avoid iframe window.confirm blocks
    if (confirmingId !== id) {
      setConfirmingId(id);
      // Automatically reset confirmation after 4 seconds
      setTimeout(() => {
        setConfirmingId(prev => prev === id ? null : prev);
      }, 4000);
      return;
    }

    try {
      setDeletingId(id);
      setConfirmingId(null);
      console.log('Iniciando exclusão do documento:', id);
      const giftRef = doc(db, 'gifts', id);
      await deleteDoc(giftRef);
      console.log('Documento excluído com sucesso');
      alert('Presente removido!');
    } catch (error: any) {
       console.error('Erro ao excluir:', error);
       const errorMsg = error.code === 'permission-denied' 
         ? 'Permissão negada. Verifique se você é o admin (gabrielcalid@gmail.com).' 
         : 'Erro: ' + (error.message || 'Erro desconhecido');
       alert(errorMsg);
       handleFirestoreError(error, OperationType.DELETE, `gifts/${id}`);
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <div className="p-8 text-center">Carregando...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-sm w-full border border-slate-100">
          <Lock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-slate-800 mb-6">Administração</h2>
          <button onClick={login} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors cursor-pointer">
            Entrar com Google
          </button>
          <div className="mt-4">
               <Link to="/" className="text-sm text-blue-500 hover:underline">Voltar ao site</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-blue-900 text-white p-4 shadow-sm flex justify-between items-center z-10 relative">
        <h1 className="font-medium flex items-center gap-2">
          <Lock className="w-5 h-5"/> Painel dos Noivos 
          {user.email === 'gabrielcalid@gmail.com' ? (
            <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full ml-2 uppercase font-bold tracking-wider">Admin</span>
          ) : (
            <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full ml-2 uppercase font-bold tracking-wider">Acesso p/ Leitura</span>
          )}
        </h1>
        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={() => window.open(window.location.href, '_blank')}
            className="text-[10px] sm:text-xs bg-blue-800 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-blue-700 hidden sm:flex items-center gap-1"
          >
            Abrir em nova aba
          </button>
          <span className="text-sm text-blue-200 hidden lg:inline">{user.email}</span>
          <button onClick={logout} className="p-2 hover:bg-blue-800 rounded-full transition-colors cursor-pointer" title="Sair">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 py-8 space-y-12">
        <div className="mb-4">
          <Link to="/" className="text-blue-600 hover:underline text-sm font-medium">&larr; Voltar ao site</Link>
        </div>

        {/* RSVP Table */}
        <section className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-xl font-medium text-slate-800">Confirmações ({rsvps.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-100 text-sm">
                <tr>
                  <th className="px-6 py-3 font-medium">Nome</th>
                  <th className="px-6 py-3 font-medium">Telefone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rsvps.map(rsvp => (
                  <tr key={rsvp.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4">{rsvp.name}</td>
                    <td className="px-6 py-4">{rsvp.phone}</td>
                  </tr>
                ))}
                {rsvps.length === 0 && (
                  <tr>
                    <td colSpan={2} className="px-6 py-8 text-center text-slate-400">Nenhuma confirmação ainda.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Gift Management */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-8">
          <h2 className="text-xl font-medium text-slate-800">Gerenciar Presentes</h2>
          
          <form onSubmit={handleAddGift} className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-xl border border-slate-100">
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-slate-700 mb-4">Adicionar Novo</h3>
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">Nome do Presente</label>
              <input required type="text" value={giftName} onChange={e => setGiftName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">Valor (R$)</label>
              <input required type="number" step="0.01" min="0" value={giftValue} onChange={e => setGiftValue(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-500 mb-1">Fotos (até 3)</label>
              <input 
                type="file" 
                multiple 
                accept="image/*"
                onChange={handleFileChange} 
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" 
              />
              {giftFiles.length > 0 && (
                <p className="text-xs text-slate-500 mt-2">{giftFiles.length} arquivo(s) selecionado(s)</p>
              )}
            </div>
            <div className="md:col-span-2 flex justify-end mt-2">
              <button disabled={isUploading} type="submit" className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-2">
                {isUploading ? 'Adicionando...' : 'Adicionar'}
              </button>
            </div>
          </form>

          <div className="divide-y divide-slate-100 pt-4">
            {gifts.map(gift => (
              <div key={gift.id} className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {gift.imageUrls && gift.imageUrls[0] ? (
                     <img src={gift.imageUrls[0]} alt="" className="w-12 h-12 rounded object-cover" />
                  ): (
                    <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center text-slate-400">
                      <Gift className="w-6 h-6" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-slate-800">{gift.name}</p>
                    <p className="text-sm text-slate-500">R$ {gift.value.toFixed(2)}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDeleteGift(gift.id)} 
                  disabled={deletingId === gift.id}
                  className={`px-3 py-2 rounded-lg transition-all text-sm font-medium cursor-pointer disabled:opacity-50 ${
                    confirmingId === gift.id 
                      ? 'bg-red-600 text-white hover:bg-red-700 shadow-md transform scale-105' 
                      : 'text-red-500 hover:bg-red-50'
                  }`}
                >
                  {deletingId === gift.id ? 'Excluindo...' : confirmingId === gift.id ? 'Confirmar Exclusão?' : 'Excluir'}
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SharedLayout />}>
        <Route index element={<Inicio />} />
        <Route path="sobre" element={<Historia />} />
        <Route path="casamento" element={<Casamento />} />
        <Route path="fotos" element={<Fotos />} />
        <Route path="recados" element={<Recados />} />
        <Route path="confirmacao" element={<Confirmacao />} />
        <Route path="presentes" element={<Presentes />} />
        <Route path="pagamento-pix" element={<PagamentoPix />} />
      </Route>
      <Route path="/admin" element={<AdminPanel />} />
    </Routes>
  );
}
