import React, { useEffect, useState } from 'react';
import { Routes, Route, NavLink, useNavigate, Outlet, useLocation, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Heart, Calendar, Camera, MessageCircle, CheckCircle, Gift, Lock, LogOut, Menu, X, Upload, Trash2, Download } from 'lucide-react';
import { auth, db, storage } from './firebase';
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, deleteDoc, getDoc, setDoc } from 'firebase/firestore';
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
    <div className="min-h-screen watercolor-bg flex flex-col font-sans">
      {/* Top Header Section */}
      <header className="pt-24 pb-16 px-4 flex flex-col items-center">
        <div className="font-script text-6xl md:text-8xl lg:text-[7rem] text-slate-700 mb-12 select-none">
          <Link to="/">Josi e Gabriel</Link>
        </div>
        
        {/* Desktop Navigation */}
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
          <Link to="/admin" className="text-base md:text-lg font-medium text-slate-400 hover:text-[#8C7A6B] transition-colors flex items-center gap-1">
             <Lock className="w-4 h-4" />
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden fixed top-6 right-6 p-2 text-blue-400 hover:bg-blue-100 rounded-full transition-colors z-50 bg-white/80 backdrop-blur shadow-sm"
        >
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </header>

      {/* Mobile Sidebar Navigation */}
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

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col items-center w-full px-4 sm:px-6 py-8 max-w-6xl mx-auto animate-fade-in-up">
        <Outlet />
      </main>

      <footer className="py-12 border-t border-blue-100/50 text-center text-slate-400 text-sm">
        <p>Josi & Gabriel &bull; 13 de Agosto de 2026</p>
      </footer>
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
    <div className="flex gap-6 sm:gap-10 justify-center mt-8 p-6 max-w-lg mx-auto">
      <div className="flex flex-col items-center">
        <span className="text-4xl sm:text-5xl font-light text-slate-700">{timeLeft.days}</span>
        <span className="text-[10px] uppercase tracking-widest text-[#8C7A6B] mt-2">Dias</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-4xl sm:text-5xl font-light text-slate-700">{timeLeft.hours.toString().padStart(2, '0')}</span>
        <span className="text-[10px] uppercase tracking-widest text-[#8C7A6B] mt-2">Horas</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-4xl sm:text-5xl font-light text-slate-700">{timeLeft.minutes.toString().padStart(2, '0')}</span>
        <span className="text-[10px] uppercase tracking-widest text-[#8C7A6B] mt-2">Minutos</span>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-4xl sm:text-5xl font-light text-slate-700">{timeLeft.seconds.toString().padStart(2, '0')}</span>
        <span className="text-[10px] uppercase tracking-widest text-[#8C7A6B] mt-2">Segundos</span>
      </div>
    </div>
  );
}

function Inicio() {
  return (
    <div className="relative text-center w-full max-w-5xl mx-auto space-y-12 pb-20">
      {/* Framed Photo */}
      <div className="relative max-w-4xl mx-auto px-4 sm:px-12 z-20">
        <div className="bg-white p-2 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-100 relative overflow-hidden">
          <div className="overflow-hidden aspect-[16/10] relative rounded-xl">
            <img 
              src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=2000" 
              alt="Josi e Gabriel" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Removed small corner images per request */}

      <div className="space-y-4 pt-10">
        <p className="text-[#8C7A6B] font-medium tracking-[0.2em] uppercase text-sm">Save the Date</p>
        <h2 className="text-3xl md:text-5xl font-serif text-slate-700 italic">13 de Agosto de 2026</h2>
      </div>

      <Countdown />
    </div>
  );
}

function Historia() {
  return (
    <div className="w-full space-y-12 bg-white/60 backdrop-blur-sm p-8 md:p-16 rounded-[3rem] border border-blue-100/50 text-center shadow-sm">
      <div className="space-y-4">
        <Heart className="w-8 h-8 text-blue-300 mx-auto opacity-50" />
        <h2 className="text-4xl md:text-5xl font-script text-blue-400">Nossa História</h2>
      </div>
      <div className="space-y-8 text-slate-600 leading-relaxed text-lg max-w-3xl mx-auto text-left font-light">
        <p className="first-letter:text-5xl first-letter:font-script first-letter:text-blue-400 first-letter:mr-3 first-letter:float-left">Nossa história começou muito antes do nosso primeiro encontro. Deus, em Sua bondade, escreveu cada detalhe do nosso caminho e nos uniu no tempo certo.</p>
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
        resolve(canvas.toDataURL('image/jpeg', 0.7)); 
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

function Casamento() {
  const [eventImage, setEventImage] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'site_images', 'evento'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().base64) {
        setEventImage(docSnap.data().base64);
      }
    });
    return () => unsub();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        if (!auth.currentUser) {
          await signInWithPopup(auth, new GoogleAuthProvider());
        }
        const base64 = await compressImage(e.target.files[0]);
        await setDoc(doc(db, 'site_images', 'evento'), { base64 });
        alert('Foto atualizada com sucesso!');
      } catch (err: any) {
        console.error(err);
        if (err.code === 'permission-denied') {
          alert('Apenas o administrador (gabrielcalid@gmail.com) pode mudar a foto.');
        } else {
          alert('Erro ao atualizar foto. Tente novamente.');
        }
      }
    }
  };

  return (
    <div className="w-full space-y-12 bg-white/60 backdrop-blur-sm p-8 md:p-16 rounded-[3rem] border border-blue-100/50 text-center shadow-sm">
      <div className="space-y-4">
        <Calendar className="w-8 h-8 text-blue-300 mx-auto opacity-50" />
        <h2 className="text-4xl md:text-5xl font-script text-blue-400">O Casamento</h2>
      </div>
      <div className="grid md:grid-cols-2 gap-12 text-left items-center">
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-blue-900 font-medium uppercase tracking-widest text-xs">Data e Horário</h3>
            <p className="text-2xl text-slate-700 font-light">13 de Agosto de 2026 às 19:30h</p>
          </div>
          <div className="space-y-2">
            <h3 className="text-blue-900 font-medium uppercase tracking-widest text-xs">Local</h3>
            <p className="text-2xl text-slate-700 font-light italic">Em breve mais informações...</p>
          </div>
        </div>
        <div className="space-y-4">
          <div className="aspect-[4/5] bg-blue-50/50 rounded-2xl overflow-hidden shadow-inner border border-blue-100/50 flex items-center justify-center relative">
            <img 
              src={eventImage || "/foto-evento.jpg"} 
              alt="Foto do Evento ou Convite" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextElementSibling) {
                  e.currentTarget.nextElementSibling.classList.remove('hidden');
                }
              }}
            />
            <div className="text-center p-8 absolute inset-0 flex flex-col items-center justify-center hidden">
               <Camera className="w-12 h-12 text-blue-200 mx-auto mb-4" />
               <p className="text-blue-300 font-light italic">Nenhuma foto adicionada</p>
            </div>
          </div>
          
          <label className="flex items-center justify-center gap-2 w-full py-4 bg-blue-400 hover:bg-blue-500 text-white font-medium rounded-2xl transition-all shadow-md active:scale-[0.98] cursor-pointer">
            <Upload className="w-5 h-5" /> Mudar Foto do Evento
            <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          </label>
        </div>
      </div>
    </div>
  );
}

function Fotos() {
  const [galleryImages, setGalleryImages] = useState<Record<number, string>>({});

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'site_images', 'galeria'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().images) {
        setGalleryImages(docSnap.data().images);
      }
    });
    return () => unsub();
  }, []);

  const handleUpload = async (pos: number, file: File) => {
    try {
      if (!auth.currentUser) {
        await signInWithPopup(auth, new GoogleAuthProvider());
      }
      const base64 = await compressImage(file);
      const currentDoc = await getDoc(doc(db, 'site_images', 'galeria'));
      const images = currentDoc.exists() ? currentDoc.data().images || {} : {};
      images[pos] = base64;
      await setDoc(doc(db, 'site_images', 'galeria'), { images });
      alert(`Momento ${pos} atualizado com sucesso!`);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'permission-denied') {
        alert('Apenas o administrador (gabrielcalid@gmail.com) pode mudar a foto.');
      } else {
        alert('Erro ao atualizar. Tente novamente.');
      }
    }
  };

  return (
    <div className="w-full space-y-12 bg-white/60 backdrop-blur-sm p-8 md:p-16 rounded-[3rem] border border-blue-100/50 text-center shadow-sm">
      <div className="space-y-4">
        <Camera className="w-8 h-8 text-blue-300 mx-auto opacity-50" />
        <h2 className="text-4xl md:text-5xl font-script text-blue-400">Nossos Momentos</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="aspect-square bg-white p-2 md:p-3 shadow-md rounded-[1rem] transform odd:rotate-1 even:-rotate-1 hover:rotate-0 transition-all duration-300 border border-slate-50 group relative">
            <div className="w-full h-full bg-blue-50/50 flex items-center justify-center overflow-hidden relative rounded-lg">
              <img 
                src={galleryImages[i] || `/foto-galeria-${i}.jpg`} 
                alt={`Momento ${i}`} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.nextElementSibling) {
                    e.currentTarget.nextElementSibling.classList.remove('hidden');
                  }
                }}
              />
              <div className="text-center p-4 absolute inset-0 flex flex-col items-center justify-center hidden bg-blue-50/50">
                <Camera className="w-8 h-8 text-blue-200 mx-auto mb-2" />
                <span className="text-blue-300 font-light italic text-sm mt-1">Vazio</span>
              </div>
            </div>
            
            <label className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-[1rem] cursor-pointer">
              <Upload className="w-8 h-8 text-white mb-2" />
              <span className="text-white text-xs font-medium px-2 text-center">Alterar Foto</span>
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleUpload(i, e.target.files[0]);
                  }
                }} 
                className="hidden" 
              />
            </label>
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
    <div className="w-full space-y-12 max-w-3xl mx-auto">
      <div className="text-center space-y-4">
        <MessageCircle className="w-8 h-8 text-rose-300 mx-auto opacity-50" />
        <h2 className="text-4xl md:text-5xl font-script text-rose-400">Deixe seu Recado</h2>
      </div>

      <form onSubmit={handleSendMessage} className="bg-gradient-to-br from-rose-200/90 to-rose-300/90 backdrop-blur-md p-8 md:p-12 rounded-[3rem] shadow-2xl text-white relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-black/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-white/80 font-semibold ml-1">Seu Nome</label>
              <input required type="text" value={msgName} onChange={e => setMsgName(e.target.value)} placeholder="Como você quer ser identificado?" className="w-full px-5 py-4 rounded-2xl bg-white/20 text-white placeholder-white/40 border-transparent focus:bg-white/30 focus:ring-2 focus:ring-white/50 outline-none transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-widest text-white/80 font-semibold ml-1">WhatsApp (Opcional)</label>
              <input type="text" value={msgPhone} onChange={e => setMsgPhone(e.target.value)} placeholder="(00) 00000-0000" className="w-full px-5 py-4 rounded-2xl bg-white/20 text-white placeholder-white/40 border-transparent focus:bg-white/30 focus:ring-2 focus:ring-white/50 outline-none transition-all" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-white/80 font-semibold ml-1">Sua Mensagem</label>
            <textarea required value={msgText} onChange={e => setMsgText(e.target.value)} rows={4} placeholder="Escreva algo carinhoso..." className="w-full px-5 py-4 rounded-[1.5rem] bg-white/20 text-white border-transparent focus:bg-white/30 focus:ring-2 focus:ring-white/50 outline-none transition-all resize-none placeholder-white/40"></textarea>
          </div>
          <button type="submit" className="w-full py-4 mt-6 bg-white text-rose-400 hover:bg-rose-50 font-bold rounded-2xl transition-all shadow-lg active:scale-[0.98] cursor-pointer">Enviar Recado com Carinho</button>
        </div>
      </form>

      {messages.length > 0 && (
        <div className="space-y-8 pt-6">
          <h3 className="text-xl font-light text-blue-400 text-center tracking-[0.2em] uppercase">Mural de Afetos</h3>
          <div className="grid gap-6">
            {messages.map((msg) => (
              <div key={msg.id} className="bg-white/40 border border-white/60 p-6 rounded-2xl shadow-sm relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Heart size={40} className="text-blue-400" />
                </div>
                <p className="text-slate-600 font-light leading-relaxed italic mb-4">"{msg.text}"</p>
                <div className="flex items-center gap-2">
                  <div className="h-px bg-blue-100 flex-grow"></div>
                  <p className="text-sm text-blue-400 font-medium tracking-wide">Com amor, {msg.name}</p>
                </div>
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
  const [rsvps, setRsvps] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'rsvps'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRsvps(msgs);
    });
    return () => unsub();
  }, []);

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
    <div className="w-full space-y-12 max-w-2xl mx-auto">
      <div className="text-center space-y-4">
        <CheckCircle className="w-8 h-8 text-rose-300 mx-auto opacity-50" />
        <h2 className="text-4xl md:text-5xl font-script text-rose-400">Confirmar Presença</h2>
        <p className="text-slate-500 font-light max-w-sm mx-auto tracking-wide">É uma alegria imensa ter você conosco. Por favor, confirme até 30 dias antes.</p>
      </div>

      <form onSubmit={handleSendRsvp} className="bg-gradient-to-br from-rose-200/90 to-rose-300/90 backdrop-blur-md p-8 md:p-12 rounded-[3rem] shadow-2xl space-y-8 text-white relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-black/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-white/80 font-semibold ml-1">Nome Completo</label>
            <input required type="text" value={rsvpName} onChange={e => setRsvpName(e.target.value)} placeholder="Como está no convite?" className="w-full px-5 py-4 rounded-2xl bg-white/20 text-white placeholder-white/40 border-transparent focus:bg-white/30 focus:ring-2 focus:ring-white/50 outline-none transition-all" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-widest text-white/80 font-semibold ml-1">Telefone WhatsApp</label>
            <input required type="text" value={rsvpPhone} onChange={e => setRsvpPhone(e.target.value)} placeholder="(00) 00000-0000" className="w-full px-5 py-4 rounded-2xl bg-white/20 text-white placeholder-white/40 border-transparent focus:bg-white/30 focus:ring-2 focus:ring-white/50 outline-none transition-all" />
          </div>
          <button type="submit" className="w-full py-4 mt-6 bg-white text-rose-400 hover:bg-rose-50 font-bold rounded-2xl transition-all shadow-lg active:scale-[0.98] cursor-pointer">Confirmar Minha Presença</button>
        </div>
      </form>

      {rsvps.length > 0 && (
        <div className="pt-8 space-y-6">
          <h3 className="text-2xl font-script text-slate-700 text-center">Presenças Confirmadas ({rsvps.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rsvps.map((rsvp: any) => (
              <div key={rsvp.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group">
                <div className="flex flex-col">
                  <span className="font-medium text-slate-700">{rsvp.name}</span>
                  <span className="text-xs text-slate-500">{rsvp.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <button 
                    type="button"
                    onClick={async (e) => {
                      e.preventDefault();
                      try {
                        await deleteDoc(doc(db, 'rsvps', rsvp.id));
                      } catch(err: any) {
                        console.error(err);
                        alert('Erro ao excluir presença: ' + err.message);
                      }
                    }} 
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-slate-50 rounded-full transition-all"
                    title="Excluir presença"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
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
    <div className="w-full space-y-12">
      <div className="text-center space-y-4">
        <Gift className="w-8 h-8 text-blue-300 mx-auto opacity-50" />
        <h2 className="text-4xl md:text-5xl font-script text-blue-400">Lista de Presentes</h2>
        <p className="text-slate-500 font-light max-w-lg mx-auto tracking-wide">Sua presença é nosso maior presente! Se desejar nos presentear, preparamos algumas sugestões abaixo.</p>
      </div>
      
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 pt-6 pb-20">
        {gifts.map(gift => {
          const valueStr = gift.value.toFixed(2);
          const [intPart, decPart] = valueStr.split('.');
          return (
            <div key={gift.id} className="bg-white/80 p-3 shadow-sm rounded-sm border border-slate-200/60 flex flex-col group transition-all hover:shadow-md">
              <div className="h-48 bg-slate-100 relative overflow-hidden rounded-sm">
                {gift.imageUrls && gift.imageUrls[0] ? (
                  <img src={gift.imageUrls[0]} alt={gift.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Gift className="w-10 h-10 text-slate-300" />
                  </div>
                )}
              </div>
              <div className="p-4 flex-grow flex flex-col text-center items-center justify-between">
                <h3 className="font-semibold text-blue-600 text-xs tracking-wider uppercase mb-4 h-10 flex items-center justify-center leading-tight w-full px-2">{gift.name}</h3>
                <div className="text-slate-500 mb-6 flex items-baseline justify-center gap-1">
                  <span className="text-sm font-medium">R$</span>
                  <span className="text-4xl font-light">{intPart}</span>
                  <span className="text-sm font-medium">,{decPart}</span>
                </div>
                <button 
                  onClick={() => navigate('/pagamento-pix', { state: { gift } })}
                  className="mt-auto block w-3/4 py-2 bg-[#E17E9B] hover:bg-[#D56B8A] text-white text-sm font-medium rounded-sm transition-all shadow-sm active:scale-[0.98] cursor-pointer">
                  Presentear
                </button>
              </div>
            </div>
          );
        })}
        
        {gifts.length === 0 && (
          <div className="col-span-full py-20 text-center text-blue-300 bg-white shadow-sm rounded-[2rem] border border-blue-50 border-dashed">
            A lista de presentes está sendo preparada com muito carinho.
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
        <p className="text-slate-600 text-lg font-light">Nenhum presente selecionado.</p>
        <button onClick={() => navigate('/presentes')} className="text-blue-400 underline font-medium cursor-pointer">Voltar para a lista</button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-12 bg-white/70 backdrop-blur-md p-8 md:p-12 rounded-[3.5rem] border border-blue-100/50 shadow-sm text-center relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-1.5 bg-blue-300"></div>
      
      <div className="space-y-4">
        <div className="w-16 h-16 bg-blue-50 text-blue-300 rounded-full flex items-center justify-center mx-auto shadow-inner border border-blue-100/50">
          <Gift className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-script text-blue-400">Presentear com Pix</h2>
      </div>
      
      <div className="space-y-2">
        <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold">Você escolheu</p>
        <p className="text-xl font-light text-slate-800 italic">{gift.name}</p>
        <p className="text-4xl font-light text-blue-400 tracking-tight">R$ {gift.value.toFixed(2)}</p>
      </div>
      
      <div className="space-y-6 text-left bg-white/50 p-6 rounded-[2rem] border border-blue-50/50">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.2em] text-blue-900 font-bold mb-3 opacity-50">Chave Pix (Celular)</p>
          <div className="relative group">
            <div className="bg-slate-50 w-full py-4 rounded-2xl font-mono text-2xl font-semibold text-blue-900 tracking-widest text-center border border-blue-100 group-hover:border-blue-200 transition-colors">
              {pixPhone}
            </div>
          </div>
        </div>
        
        <button 
          onClick={() => {
            navigator.clipboard.writeText(pixPhone);
            alert("Chave Pix copiada com sucesso!");
          }}
          className="w-full py-4 bg-blue-400 hover:bg-blue-500 text-white font-medium rounded-2xl transition-all shadow-md active:scale-[0.98] cursor-pointer"
        >
          Copiar Chave Pix
        </button>

        <ul className="text-[11px] text-slate-400 space-y-2 pt-2 px-1 font-medium leading-relaxed">
          <li className="flex gap-2"><span>&bull;</span> Abra seu app do banco e escolha Pix Escanear ou Pagar.</li>
          <li className="flex gap-2"><span>&bull;</span> Use a chave celular acima e confira o valor.</li>
        </ul>
      </div>

      <div className="pt-4">
        <p className="text-sm text-blue-300 mb-8 italic font-light tracking-wide">Deus abençoe imensamente sua vida! ❤️</p>
        <button onClick={() => navigate('/presentes')} className="text-slate-400 hover:text-blue-400 transition-colors font-medium cursor-pointer flex items-center justify-center gap-2 mx-auto text-sm">
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

        {/* Images Management */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-8">
          <h2 className="text-xl font-medium text-slate-800">Gerenciar Imagens do Site</h2>
          
          <div className="space-y-6">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
              <h3 className="text-sm font-medium text-slate-700 mb-2">Foto "O Evento"</h3>
              <p className="text-xs text-slate-500 mb-4">Escolha uma foto para destacar o espaço "O Evento / Convite".</p>
              <input 
                type="file" 
                accept="image/*"
                onChange={async (e) => {
                  if (e.target.files && e.target.files[0]) {
                    try {
                      const base64 = await compressImage(e.target.files[0]);
                      await setDoc(doc(db, 'site_images', 'evento'), { base64 });
                      alert('Foto do evento atualizada!');
                    } catch(err) {
                      alert('Erro ao atualizar. Tente uma foto menor.');
                    }
                  }
                }}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
            </div>

            <div className="bg-slate-50 p-6 rounded-xl border border-slate-100">
              <h3 className="text-sm font-medium text-slate-700 mb-2">Fotos "Nossos Momentos"</h3>
              <p className="text-xs text-slate-500 mb-4">Adicione até 6 fotos para a galeria do site.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map(pos => (
                  <div key={pos} className="border border-slate-200 bg-white p-3 rounded-lg flex flex-col items-center text-center gap-2">
                    <span className="text-xs font-medium text-slate-500">Espaço {pos}</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={async (e) => {
                        if (e.target.files && e.target.files[0]) {
                          try {
                            const base64 = await compressImage(e.target.files[0]);
                            const currentDoc = await getDoc(doc(db, 'site_images', 'galeria'));
                            const images = currentDoc.exists() ? currentDoc.data().images || {} : {};
                            images[pos] = base64;
                            await setDoc(doc(db, 'site_images', 'galeria'), { images });
                            alert(`Foto da galeria (espaço ${pos}) atualizada!`);
                          } catch(err) {
                            alert('Erro ao atualizar foto. Tente uma foto menor.');
                          }
                        }
                      }}
                      className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>
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
