import React, { useState, useEffect, useRef, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithCustomToken, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc,
  collection, 
  addDoc, 
  onSnapshot 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "กรอก_API_KEY_ของคุณที่นี่",                     // 👈 กรอก API Key จาก Firebase ของคุณ
  authDomain: "send-system-862c4.firebaseapp.com",
  projectId: "send-system-862c4",
  storageBucket: "send-system-862c4.appspot.com",
  messagingSenderId: "กรอก_MESSAGING_SENDER_ID_ของคุณที่นี่", // 👈 กรอก Sender ID จาก Firebase ของคุณ
  appId: "กรอก_APP_ID_ของคุณที่นี่"                            // 👈 กรอก App ID จาก Firebase ของคุณ
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'secret-chat-app-id';

const AVATARS = [
  { id: 'avatar1', icon: 'transmitter', name: 'Agent_Alpha (S-01)', color: 'bg-amber-600/20 text-[#FCA311] border-[#FCA311]/40' },
  { id: 'avatar2', icon: 'terminal', name: 'Client_Beta (C-02)', color: 'bg-amber-600/20 text-[#FCA311] border-[#FCA311]/40' },
  { id: 'avatar3', icon: 'shield', name: 'Proxy_Gamma (P-03)', color: 'bg-amber-600/20 text-[#FCA311] border-[#FCA311]/40' },
  { id: 'avatar4', icon: 'core', name: 'Host_Delta (H-04)', color: 'bg-amber-600/20 text-[#FCA311] border-[#FCA311]/40' },
  { id: 'avatar5', icon: 'processor', name: 'Daemon_Epsilon (D-05)', color: 'bg-amber-600/20 text-[#FCA311] border-[#FCA311]/40' },
  { id: 'avatar6', icon: 'network', name: 'Sensor_Zeta (S-06)', color: 'bg-amber-600/20 text-[#FCA311] border-[#FCA311]/40' },
  { id: 'avatar7', icon: 'database', name: 'Router_Eta (R-07)', color: 'bg-amber-600/20 text-[#FCA311] border-[#FCA311]/40' },
  { id: 'avatar8', icon: 'key', name: 'Crypt_Theta (C-08)', color: 'bg-amber-600/20 text-[#FCA311] border-[#FCA311]/40' }
];

function NodeIcon({ type, className = "w-6 h-6" }) {
  switch (type) {
    case 'transmitter':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M12 2a10 10 0 0 1 10 10c0 2.4-.85 4.6-2.27 6.32l-1.42-1.42A8 8 0 0 0 20 12a8 8 0 0 0-8-8 8 8 0 0 0-8 8c0 1.9.65 3.65 1.7 5l-1.42 1.42A10 10 0 0 1 12 2zm0 6a4 4 0 0 1 4 4c0 .96-.34 1.84-.9 2.53l-1.42-1.42a2 2 0 0 0 .32-1.11 2 2 0 0 0-2-2 2 2 0 0 0-1.11.32L9.47 9.9A4 4 0 0 1 12 8zm0 3a1 1 0 1 0 0 2 1 1 0 0 0 0-2z" />
        </svg>
      );
    case 'terminal':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <polyline points="4 17 10 11 4 5" />
          <line x1="12" y1="19" x2="20" y2="19" />
        </svg>
      );
    case 'shield':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case 'core':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      );
    case 'processor':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <rect x="9" y="9" width="6" height="6" />
          <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
        </svg>
      );
    case 'network':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M18 3a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3zM6 15a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3zm12 0a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3zM6 3a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3zm12 5L6 16m0-8l12 8" />
        </svg>
      );
    case 'database':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M3 5v6c0 1.66 4 3 9 3s9-1.34 9-3V5M3 11v6c0 1.66 4 3 9 3s9-1.34 9-3v-6" />
        </svg>
      );
    case 'key':
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3m-3-3l-2.5-2.5m5.5 1.5l1.5-1.5" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}

export default function App() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);
  const [roomKeyInput, setRoomKeyInput] = useState('');
  
  // Login and connection statuses
  const [isJoined, setIsJoined] = useState(false);
  const [roomKey, setRoomKey] = useState('');
  
  // Cloud session retention
  const [hasSavedSession, setHasSavedSession] = useState(false);
  const [showUnlockScreen, setShowUnlockScreen] = useState(false);
  const [unlockPasswordInput, setUnlockPasswordInput] = useState('');
  const [savedRoomKey, setSavedRoomKey] = useState('');
  const [isRestoringSession, setIsRestoringSession] = useState(true);

  // Pin / Favorites logic
  const [favorites, setFavorites] = useState([]); // Array of favorite channels/users

  // Realtime data buckets
  const [messages, setMessages] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [activeChat, setActiveChat] = useState('group'); // 'group' or 'userId'
  
  // Input fields & indicators
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);

  // Graph render modal
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Appearance & Alerts
  const [darkMode, setDarkMode] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Trigger system warning / notification
  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 4000);
  };

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth error:", err);
        showToast("ไม่สามารถซิงค์ข้อมูลกับคลาวด์ได้ กรุณาตรวจสอบการตั้งค่า Firebase");
        setIsRestoringSession(false);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, async (usr) => {
      if (usr) {
        setUser(usr);
        
        // Restore recent configuration keys from secure cloud nodes
        try {
          const profileDocRef = doc(db, 'artifacts', appId, 'users', usr.uid, 'profile', 'user_info');
          const profileSnap = await getDoc(profileDocRef);
          if (profileSnap.exists()) {
            const data = profileSnap.data();
            if (data.username && data.roomKey) {
              setUsername(data.username);
              setSavedRoomKey(data.roomKey);
              setFavorites(data.favorites || []);
              
              // Restore matching vector avatar
              const matchedAvatar = AVATARS.find(av => av.id === data.avatar?.id);
              if (matchedAvatar) setSelectedAvatar(matchedAvatar);
              
              setHasSavedSession(true);
              setShowUnlockScreen(true);
            }
          }
        } catch (err) {
          console.error("Error restoring session:", err);
        }
      }
      setIsRestoringSession(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !isJoined) return;

    // Direct message streams listener
    const messagesCollection = collection(db, 'artifacts', appId, 'public', 'data', 'messages');
    const unsubMessages = onSnapshot(messagesCollection, (snapshot) => {
      const msgList = [];
      snapshot.forEach((doc) => {
        msgList.push({ id: doc.id, ...doc.data() });
      });
      msgList.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      setMessages(msgList);
    }, (error) => {
      console.error("Logs fetch error:", error);
    });

    // Device presence observer
    const usersCollection = collection(db, 'artifacts', appId, 'public', 'data', 'users');
    const unsubUsers = onSnapshot(usersCollection, (snapshot) => {
      const uList = [];
      snapshot.forEach((doc) => {
        uList.push({ id: doc.id, ...doc.data() });
      });
      setAllUsers(uList);
    }, (error) => {
      console.error("Nodes fetch error:", error);
    });

    return () => {
      unsubMessages();
      unsubUsers();
    };
  }, [user, isJoined]);

  useEffect(() => {
    if (!user || !isJoined) return;

    const updatePresence = async () => {
      try {
        const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
        await setDoc(userDocRef, {
          uid: user.uid,
          username: username,
          avatar: selectedAvatar,
          roomKey: roomKey,
          lastActive: Date.now(),
          typingTo: isTyping ? activeChat : null
        }, { merge: true });
      } catch (err) {
        console.error("Error updating presence:", err);
      }
    };

    updatePresence();
    const interval = setInterval(updatePresence, 7000);

    return () => clearInterval(interval);
  }, [user, isJoined, username, selectedAvatar, roomKey, isTyping, activeChat]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages, activeChat]);

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      showToast("กรุณาระบุ Operator ID ก่อนเข้าสู่ระบบ");
      return;
    }
    if (!roomKeyInput.trim()) {
      showToast("กรุณาระบุคีย์สถิติวงจรเชื่อมต่อ (Shared Project Key)");
      return;
    }
    
    const chosenRoomKey = roomKeyInput.trim();
    setRoomKey(chosenRoomKey);
    setSavedRoomKey(chosenRoomKey);
    setIsJoined(true);
    setShowUnlockScreen(false);
    
    if (user) {
      try {
        const profileDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'user_info');
        await setDoc(profileDocRef, {
          username: username.trim(),
          roomKey: chosenRoomKey,
          avatar: selectedAvatar,
          favorites: favorites,
          updatedAt: Date.now()
        }, { merge: true });
      } catch (err) {
        console.error("Error saving user profile session:", err);
      }
    }
    
    showToast(`เชื่อมต่อเข้ากับสเปซโหนด: "${chosenRoomKey}" สำเร็จ`);
  };

  const handleUnlockSession = (e) => {
    e.preventDefault();
    if (unlockPasswordInput.trim() === savedRoomKey) {
      setRoomKey(savedRoomKey);
      setIsJoined(true);
      setShowUnlockScreen(false);
      showToast("กู้คืนข้อมูลและเชื่อมต่อท่อสัญญาณเรียบร้อย");
    } else {
      showToast("❌ รหัสตรวจสอบไม่ตรงกับรหัสวงจรอ้างอิง");
    }
  };

  const handleResetSession = async () => {
    setHasSavedSession(false);
    setShowUnlockScreen(false);
    setUnlockPasswordInput('');
    setUsername('');
    setRoomKeyInput('');
    setRoomKey('');
    setSavedRoomKey('');
    setFavorites([]);
    
    if (user) {
      try {
        const profileDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'user_info');
        await setDoc(profileDocRef, {
          username: '',
          roomKey: '',
          favorites: [],
          updatedAt: Date.now()
        }, { merge: true });
      } catch (err) {
        console.error("Error clearing session:", err);
      }
    }
    showToast("กรุณาลงทะเบียนชุดข้อมูลใหม่เพื่อตั้งค่า");
  };

  const handleConfirmExit = async () => {
    setShowExitConfirm(false);
    setIsJoined(false);
    setRoomKey('');
    setRoomKeyInput('');
    setHasSavedSession(false);
    
    if (user) {
      try {
        const profileDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'user_info');
        await setDoc(profileDocRef, {
          username: '',
          roomKey: '',
          updatedAt: Date.now()
        }, { merge: true });
      } catch (err) {
        console.error("Error clearing user profile session:", err);
      }
    }
    showToast("ยกเลิกการแชร์สัญญาณโหนดเครือข่ายแล้ว");
  };

  const handleSendMessage = async (e, customText = null, customImg = null, isAi = false) => {
    if (e) e.preventDefault();
    
    const textToSend = customText !== null ? customText : inputText;
    const imgToSend = customImg !== null ? customImg : null;

    if (!textToSend.trim() && !imgToSend) return;
    if (!user) {
      showToast("กรุณารอสักครู่ โหนดสัญญาณกำลังปรับแบนด์วิดท์...");
      return;
    }

    try {
      const newMessage = {
        senderId: user.uid,
        senderName: username,
        senderAvatar: selectedAvatar,
        roomKey: roomKey,
        text: textToSend,
        imageUrl: imgToSend,
        isAiGenerated: isAi,
        recipientId: activeChat,
        timestamp: Date.now()
      };

      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), newMessage);
      if (!customText && !customImg) {
        setInputText('');
      }
      
      setIsTyping(false);
      const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
      await setDoc(userDocRef, { typingTo: null }, { merge: true });

    } catch (err) {
      console.error("Send error:", err);
      showToast("ระบบขัดข้อง: ตรวจสอบความถูกต้องของ Rules ในคอนโซลคลาวด์");
    }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
    }

    if (typingTimeout) clearTimeout(typingTimeout);

    const timeout = setTimeout(async () => {
      setIsTyping(false);
      if (user) {
        const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
        await setDoc(userDocRef, { typingTo: null }, { merge: true });
      }
    }, 2000);

    setTypingTimeout(timeout);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast("กรุณาแนบไฟล์รูปภาพเท่านั้น");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast("ขนาดไฟล์ Asset เกินขีดจำกัด 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      handleSendMessage(null, "📊 แนบรายงานสถิติ (Asset)", reader.result, false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const toggleFavorite = async (chatId, e) => {
    e.stopPropagation();
    let updatedFavorites;
    if (favorites.includes(chatId)) {
      updatedFavorites = favorites.filter(id => id !== chatId);
    } else {
      updatedFavorites = [...favorites, chatId];
    }
    
    setFavorites(updatedFavorites);

    if (user) {
      try {
        const profileDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'user_info');
        await setDoc(profileDocRef, { favorites: updatedFavorites }, { merge: true });
        showToast("แก้ไขสถานะหมวดหมู่สำคัญแล้ว");
      } catch (err) {
        console.error("Error toggling favorite on cloud:", err);
      }
    }
  };

  const generateAiImage = async () => {
    if (!aiPrompt.trim()) {
      showToast("กรุณากรอกคีย์โค้ดจำลองกราฟิกสถิติ");
      return;
    }

    setIsGenerating(true);
    const apiKey = ""; 

    const callApiWithBackoff = async (retries = 5, delay = 1000) => {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instances: { prompt: aiPrompt },
            parameters: { sampleCount: 1 }
          })
        });

        if (!response.ok) throw new Error("API Connection Error");

        const data = await response.json();
        if (data.predictions && data.predictions[0]?.bytesBase64Encoded) {
          return `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`;
        } else {
          throw new Error("Invalid output format");
        }
      } catch (err) {
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
          return callApiWithBackoff(retries - 1, delay * 2);
        }
        throw err;
      }
    };

    try {
      const base64Image = await callApiWithBackoff();
      await handleSendMessage(null, `🤖 เรนเดอร์แผนภูมิจำลองจากคำสั่งสถิติ: "${aiPrompt}"`, base64Image, true);
      setShowAiModal(false);
      setAiPrompt('');
      showToast("วาดรูปภาพและโพสต์เข้าหน้าต่างแชทแล้ว!");
    } catch (err) {
      console.error(err);
      showToast("เกิดข้อผิดพลาดจากเอนจิ้นคำนวณกราฟิกกรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsGenerating(false);
    }
  };

  const activeUsers = useMemo(() => {
    const cutoff = Date.now() - 20000;
    return allUsers.filter(u => u.roomKey === roomKey && u.lastActive > cutoff);
  }, [allUsers, roomKey]);

  const filteredMessages = useMemo(() => {
    return messages.filter(msg => {
      if (msg.roomKey !== roomKey) return false;
      if (activeChat === 'group') {
        return msg.recipientId === 'group';
      } else {
        return (
          (msg.senderId === user?.uid && msg.recipientId === activeChat) ||
          (msg.senderId === activeChat && msg.recipientId === user?.uid)
        );
      }
    });
  }, [messages, roomKey, activeChat, user]);

  const favoriteChatItems = useMemo(() => {
    const items = [];
    if (favorites.includes('group')) {
      items.push({ id: 'group', type: 'group', name: 'คลังบันทึกข้อมูลหลัก', icon: 'database', color: 'bg-[#FCA311]/20 border-[#FCA311]/30 text-[#FCA311]' });
    }
    activeUsers.filter(u => u.uid !== user?.uid).forEach(u => {
      if (favorites.includes(u.uid)) {
        items.push({ id: u.uid, type: 'user', name: u.username, icon: u.avatar.icon, color: u.avatar.color });
      }
    });
    return items;
  }, [favorites, activeUsers, user]);

  const typingStatusText = useMemo(() => {
    if (activeChat === 'group') {
      const typingUsers = activeUsers.filter(u => u.uid !== user?.uid && u.typingTo === 'group');
      if (typingUsers.length === 1) return `โฮสต์ ${typingUsers[0].username} กำลังบันทึกรายงาน...`;
      if (typingUsers.length > 1) return `มีโฮสต์กำลังป้อนข้อมูลระบบ ${typingUsers.length} จุด...`;
    } else {
      const targetUser = activeUsers.find(u => u.uid === activeChat);
      if (targetUser && (targetUser.typingTo === user?.uid || targetUser.typingTo === 'group')) {
        return `โหนด ${targetUser.username} กำลังป้อนคีย์ Payload...`;
      }
    }
    return null;
  }, [activeUsers, activeChat, user]);

  const currentChatTargetName = useMemo(() => {
    if (activeChat === 'group') return 'คลังบันทึกข้อมูลหลัก (Global Logs)';
    const targetUser = activeUsers.find(u => u.uid === activeChat);
    return targetUser ? `เชื่อมต่อโหนดเดี่ยวตรง: ${targetUser.username}` : 'สตรีมวงจรรุ่นสำรอง (ออฟไลน์)';
  }, [activeChat, activeUsers]);

  const currentChatTargetIcon = useMemo(() => {
    if (activeChat === 'group') return 'database';
    const targetUser = activeUsers.find(u => u.uid === activeChat);
    return targetUser ? targetUser.avatar.icon : 'terminal';
  }, [activeChat, activeUsers]);

  if (isRestoringSession) {
    return (
      <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center space-y-4" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div className="w-16 h-16 rounded-2xl bg-[#14213D] border border-[#FCA311]/40 flex items-center justify-center animate-pulse shadow-lg shadow-[#FCA311]/10 text-[#FCA311]">
          <NodeIcon type="transmitter" className="w-8 h-8" />
        </div>
        <div className="text-center">
          <p className="text-[#FCA311] text-xs font-semibold tracking-widest animate-pulse" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>ZET SYSTEM DIAGNOSTIC</p>
          <p className="text-slate-500 text-[10px] mt-1">กำลังกู้คืนสัญญาณแชนแนลโครงการล่าสุด...</p>
        </div>
      </div>
    );
  }

  if (hasSavedSession && showUnlockScreen) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center px-4 transition-colors duration-300 ${darkMode ? 'bg-[#000000] text-slate-100' : 'bg-slate-50 text-slate-900'}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        
        {toastMessage && (
          <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 flex items-center bg-[#14213D] text-[#FCA311] border border-[#FCA311] px-5 py-3 rounded-xl shadow-2xl space-x-2 animate-bounce">
            <NodeIcon type="transmitter" className="w-4 h-4" />
            <span className="text-xs font-semibold whitespace-nowrap">{toastMessage}</span>
          </div>
        )}

        <div className={`w-full max-w-md p-8 rounded-3xl shadow-2xl border text-center transition-all ${darkMode ? 'bg-[#14213D]/40 border-[#FCA311]/20' : 'bg-white border-slate-100'} backdrop-blur-md`}>
          
          <div className="mb-6 relative inline-block">
            <div className={`w-20 h-20 rounded-3xl ${selectedAvatar.color || 'bg-[#14213D]'} flex items-center justify-center shadow-lg mx-auto border border-[#FCA311]/30 animate-pulse`}>
              <NodeIcon type={selectedAvatar.icon} className="w-10 h-10" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-[#14213D] text-[#FCA311] w-6 h-6 rounded-full flex items-center justify-center border border-[#FCA311]/30">
              <NodeIcon type="key" className="w-3.5 h-3.5" />
            </div>
          </div>

          <h2 className="text-xl font-bold tracking-wider mb-1 text-[#FCA311]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            ZET SYSTEM WORKSPACE
          </h2>
          <p className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            ยืนยันผู้รับผิดชอบ: {username}
          </p>
          <p className="text-[10px] text-slate-500 mb-6">กรุณากรอกรหัสวงจรอ้างอิงเพื่อปลดล็อคสัญญาณโหนด</p>

          <form onSubmit={handleUnlockSession} className="space-y-4">
            <div>
              <input
                type="password"
                value={unlockPasswordInput}
                onChange={(e) => setUnlockPasswordInput(e.target.value)}
                placeholder="รหัสคีย์วงจรอ้างอิง"
                className={`w-full px-4 py-3 rounded-xl outline-none border text-center transition-all text-xs tracking-widest ${
                  darkMode ? 'bg-[#000000]/80 border-slate-800 focus:border-[#FCA311] text-white' : 'bg-slate-100 border-slate-200 focus:border-[#FCA311] text-slate-800'
                }`}
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#FCA311] text-slate-950 rounded-xl font-bold text-xs hover:bg-[#FCA311]/90 transition-all flex items-center justify-center space-x-2"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <NodeIcon type="key" className="w-4 h-4" />
              <span>เริ่มซิงค์สัญญาณระบบ</span>
            </button>
          </form>

          <div className="mt-8 border-t border-slate-800/40 pt-4 flex items-center justify-between">
            <button
              onClick={handleResetSession}
              className="text-[10px] text-red-400 hover:underline font-bold"
            >
              🔄 สลับบัญชี / เปลี่ยนรหัสโครงการ
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="text-[10px] text-slate-500 hover:text-slate-300"
            >
              {darkMode ? '☀️ ธีมสว่าง' : '🌙 ธีมมืด'}
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#000000] text-slate-100' : 'bg-slate-50 text-slate-900'}`} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      
      {/* Toast Warning HUD */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 z-50 flex items-center bg-[#14213D] text-[#FCA311] px-5 py-3 rounded-xl shadow-2xl space-x-2 border border-[#FCA311]/40 animate-bounce">
          <NodeIcon type="transmitter" className="w-4 h-4" />
          <span className="text-xs font-semibold whitespace-nowrap">{toastMessage}</span>
        </div>
      )}

      {!isJoined ? (
        /* ================= REGISTRY PORTAL ================= */
        <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8">
          <div className={`w-full max-w-md p-8 rounded-3xl shadow-2xl transition-all border duration-300 ${darkMode ? 'bg-[#14213D]/40 border-slate-800/60' : 'bg-white border-slate-100'} backdrop-blur-md`}>
            
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#14213D] text-[#FCA311] shadow-lg border border-[#FCA311]/30 mb-4 animate-pulse">
                <NodeIcon type="terminal" className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-black tracking-wider text-[#FCA311]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                ZET DATA PORTAL
              </h1>
              <p className={`text-[10px] mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                ระบบคลังบันทึกข้อมูลและวิเคราะห์สถิติสถานะเรียลไทม์
              </p>
            </div>

            <form onSubmit={handleJoinRoom} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-2 text-[#FCA311]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  รหัสผู้บันทึกข้อมูล (Operator ID)
                </label>
                <input
                  type="text"
                  maxLength={16}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="เช่น DB-AGENT-09"
                  className={`w-full px-4 py-3 rounded-xl outline-none border transition-all text-xs ${
                    darkMode ? 'bg-[#000000]/60 border-slate-800 focus:border-[#FCA311] text-white' : 'bg-slate-100 border-slate-200 focus:border-[#FCA311] text-slate-800'
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-2 text-[#FCA311]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  รหัสสถิติเพื่อจับคู่วงจร (Shared Project Key)
                </label>
                <input
                  type="password"
                  value={roomKeyInput}
                  onChange={(e) => setRoomKeyInput(e.target.value)}
                  placeholder="เช่น node-tunnel-500"
                  className={`w-full px-4 py-3 rounded-xl outline-none border transition-all text-xs ${
                    darkMode ? 'bg-[#000000]/60 border-slate-800 focus:border-[#FCA311] text-white' : 'bg-slate-100 border-slate-200 focus:border-[#FCA311] text-slate-800'
                  }`}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-2 text-[#FCA311]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  เลือกรูปแบบไอคอนจำลองโหนดระบบ (Agent Icon)
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {AVATARS.map((av) => (
                    <button
                      key={av.id}
                      type="button"
                      onClick={() => setSelectedAvatar(av)}
                      className={`relative flex items-center justify-center p-3 rounded-xl border transition-all ${
                        selectedAvatar.id === av.id
                          ? 'border-[#FCA311] scale-105 bg-[#FCA311]/10 text-[#FCA311]'
                          : darkMode ? 'border-slate-800 text-slate-400 hover:bg-slate-800/40' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <NodeIcon type={av.icon} className="w-6 h-6" />
                      {selectedAvatar.id === av.id && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#FCA311] rounded-full flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-slate-950" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-[#FCA311] text-slate-950 rounded-xl font-bold text-xs shadow-lg shadow-[#FCA311]/10 hover:scale-[1.01] transition-all flex items-center justify-center space-x-2"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                <span>เชื่อมต่อวงจรโหนดสารสนเทศ</span>
              </button>
            </form>

            <div className="flex justify-center mt-6">
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded-lg border text-[10px] flex items-center space-x-2 ${
                  darkMode ? 'border-slate-800 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-600 hover:text-black'
                }`}
              >
                <span>{darkMode ? '☀️ ธีมสว่าง' : '🌙 ธีมมืด'}</span>
              </button>
            </div>

          </div>
        </div>
      ) : (
        /* ================= CORE CONSOLE VIEW ================= */
        <div className="flex h-screen overflow-hidden relative">

          {/* LEFT TELEMETRY SIDEBAR */}
          <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-72 transition-transform duration-300 transform lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } ${
            darkMode ? 'bg-[#000000] border-r border-[#14213D]' : 'bg-white border-r border-slate-200'
          } flex flex-col`}>
            
            <div className={`p-4 border-b flex items-center justify-between ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-xl ${selectedAvatar.color} flex items-center justify-center shadow-inner border border-[#FCA311]/30`}>
                  <NodeIcon type={selectedAvatar.icon} className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[10px] font-bold text-[#FCA311] uppercase tracking-wider" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>โหนดผู้ดูแล</h3>
                  <p className="font-semibold text-xs max-w-[140px] truncate">{username}</p>
                </div>
              </div>
              <button
                onClick={() => setShowExitConfirm(true)}
                className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors text-[10px] font-bold flex items-center space-x-1"
                title="ตัดการเชื่อมต่อสัญญาณ"
              >
                <span>🔌 ตัดวงจร</span>
              </button>
            </div>

            <div className="p-4">
              <div className={`p-3 rounded-2xl ${darkMode ? 'bg-[#14213D]/40 border border-[#FCA311]/20' : 'bg-[#14213D]/5 border border-[#14213D]/10'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-medium text-[#FCA311]">🔑 รหัสวงจรสตรีม</span>
                </div>
                <div className="font-mono font-bold text-xs flex items-center justify-between text-[#FCA311]">
                  <span>{roomKey}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 space-y-4">
              
              {/* Telemetry Stars */}
              {favoriteChatItems.length > 0 && (
                <div>
                  <h4 className="px-3 text-[9px] font-bold uppercase tracking-wider text-[#FCA311] flex items-center mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                    <span className="mr-1">★</span> โหนดสถิติติดดาว ({favoriteChatItems.length})
                  </h4>
                  <div className="space-y-1">
                    {favoriteChatItems.map((item) => (
                      <button
                        key={`fav-${item.id}`}
                        onClick={() => { setActiveChat(item.id); setSidebarOpen(false); }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl transition-all ${
                          activeChat === item.id 
                            ? 'bg-[#FCA311] text-slate-950 font-bold' 
                            : darkMode ? 'bg-[#14213D]/40 hover:bg-[#14213D]/80 text-[#FCA311]' : 'bg-amber-50 hover:bg-amber-100 text-[#FCA311]'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <div className={`w-8 h-8 rounded-lg ${item.color} flex items-center justify-center border border-[#FCA311]/20`}>
                            <NodeIcon type={item.icon} className="w-4 h-4" />
                          </div>
                          <span className="text-[11px] truncate">{item.name}</span>
                        </div>
                        <span 
                          onClick={(e) => toggleFavorite(item.id, e)}
                          className="text-[#FCA311] cursor-pointer text-xs p-1"
                        >
                          ★
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Registry Root */}
              <div>
                <h4 className="px-3 text-[9px] font-bold uppercase tracking-wider text-slate-500 mb-1" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>คลังสถิติสากล</h4>
                <button
                  onClick={() => { setActiveChat('group'); setSidebarOpen(false); }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                    activeChat === 'group' ? 'bg-[#14213D] border border-[#FCA311]/30 text-[#FCA311]' : darkMode ? 'hover:bg-slate-900 text-slate-400' : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <NodeIcon type="database" className="w-5 h-5 text-[#FCA311]" />
                    <span className="text-xs font-semibold">คลังบันทึกข้อมูลหลัก</span>
                  </div>
                  <span 
                    onClick={(e) => toggleFavorite('group', e)}
                    className={`text-xs p-1 transition-colors ${favorites.includes('group') ? 'text-[#FCA311]' : 'text-slate-500 hover:text-[#FCA311]'}`}
                  >
                    {favorites.includes('group') ? '★' : '☆'}
                  </span>
                </button>
              </div>

              {/* Secondary Nodes List */}
              <div>
                <div className="px-3 flex items-center justify-between mb-2">
                  <h4 className="text-[9px] font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>ช่องเชื่อมต่อผ่านอุปกรณ์เครือข่ายเดี่ยว ({activeUsers.filter(u => u.uid !== user?.uid).length})</h4>
                </div>

                <div className="space-y-1">
                  {activeUsers.filter(u => u.uid !== user?.uid).length === 0 ? (
                    <p className="text-center text-[10px] text-slate-600 py-4 font-mono">ไม่มีอุปกรณ์อื่นเชื่อมต่อวงจรนี้</p>
                  ) : (
                    activeUsers.filter(u => u.uid !== user?.uid).map((u) => (
                      <button
                        key={u.uid}
                        onClick={() => { setActiveChat(u.uid); setSidebarOpen(false); }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl transition-all ${
                          activeChat === u.uid ? 'bg-[#14213D] border border-[#FCA311]/30 text-[#FCA311]' : darkMode ? 'hover:bg-slate-900 text-slate-400' : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-3 truncate">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center border border-[#FCA311]/20 ${u.avatar.color}`}>
                            <NodeIcon type={u.avatar.icon} className="w-4 h-4" />
                          </div>
                          <div className="text-left truncate">
                            <p className="text-xs font-semibold truncate">{u.username}</p>
                            <span className="text-[9px] text-[#FCA311] flex items-center space-x-1">
                              <span className="w-1.5 h-1.5 bg-[#FCA311] rounded-full animate-ping"></span>
                              <span>กำลัง Sync สัญญาณ</span>
                            </span>
                          </div>
                        </div>
                        <span 
                          onClick={(e) => toggleFavorite(u.uid, e)}
                          className={`text-xs p-1 transition-colors ${favorites.includes(u.uid) ? 'text-[#FCA311]' : 'text-slate-500 hover:text-[#FCA311]'}`}
                        >
                          {favorites.includes(u.uid) ? '★' : '☆'}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

          </aside>

          {/* MAIN MONITOR PANELS */}
          <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-[#000000]">
            
            <header className={`px-4 py-3 border-b flex items-center justify-between ${darkMode ? 'bg-[#000000] border-[#14213D]' : 'bg-white border-slate-100'}`}>
              <div className="flex items-center space-x-3">
                <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl lg:hidden text-slate-400 hover:bg-slate-900">
                  ☰
                </button>
                <div className="w-10 h-10 rounded-xl bg-[#14213D] border border-[#FCA311]/20 flex items-center justify-center text-[#FCA311]">
                  <NodeIcon type={currentChatTargetIcon} className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-xs lg:text-sm text-slate-200" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{currentChatTargetName}</h2>
                </div>
              </div>

              <button
                onClick={() => setShowAiModal(true)}
                className="px-3 py-1.5 bg-[#FCA311] text-slate-950 text-[10px] font-bold rounded-xl hover:bg-[#FCA311]/90"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                📊 เรนเดอร์แผนภูมิจำลอง AI
              </button>
            </header>

            <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${darkMode ? 'bg-[#000000]' : 'bg-slate-100'}`}>
              {filteredMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-[#14213D] flex items-center justify-center border border-[#FCA311]/30 mb-4 text-[#FCA311]">
                    <NodeIcon type="transmitter" className="w-6 h-6 animate-pulse" />
                  </div>
                  <p className="text-xs font-bold mb-1 text-slate-400" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>ระบบเชื่อมต่อสัญญาณเสร็จสมบูรณ์</p>
                  <p className="text-[10px] text-slate-500">สามารถป้อนชุดข้อมูล สถิติตัวแปร และแนบเอกสารรายงานโมเดลผ่านช่องทางขอบข่ายงานนี้ได้ทันที</p>
                </div>
              ) : (
                filteredMessages.map((msg, index) => {
                  const isSelf = msg.senderId === user?.uid;
                  return (
                    <div key={msg.id || index} className={`flex items-end space-x-2 ${isSelf ? 'justify-end' : 'justify-start'}`}>
                      {!isSelf && (
                        <div className={`w-8 h-8 rounded-lg ${msg.senderAvatar?.color || 'bg-slate-800'} flex items-center justify-center text-sm shrink-0 border border-[#FCA311]/20`}>
                          <NodeIcon type={msg.senderAvatar?.icon || 'terminal'} className="w-4 h-4" />
                        </div>
                      )}
                      <div className={`flex flex-col max-w-[75%] ${isSelf ? 'items-end' : 'items-start'}`}>
                        <div className={`rounded-2xl p-3 shadow-sm ${isSelf ? 'bg-[#14213D] border border-[#FCA311]/30 text-slate-200 rounded-br-none' : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'}`}>
                          {msg.imageUrl && (
                            <img src={msg.imageUrl} alt="System Asset" className="max-w-full h-auto max-h-60 rounded-md mb-2 object-cover border border-slate-800" />
                          )}
                          <p className="text-xs leading-relaxed break-words">{msg.text}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {typingStatusText && (
              <div className="px-4 py-1.5 text-[10px] text-[#FCA311] bg-slate-950 font-bold animate-pulse flex items-center space-x-1.5 border-t border-[#14213D]">
                <NodeIcon type="processor" className="w-3.5 h-3.5 animate-spin" />
                <span>{typingStatusText}</span>
              </div>
            )}

            <div className={`p-4 border-t ${darkMode ? 'bg-[#000000] border-slate-900' : 'bg-white border-slate-200'}`}>
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 bg-slate-900 border border-slate-800 text-[#FCA311] rounded-xl hover:bg-slate-800">
                  <NodeIcon type="database" className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  placeholder="ป้อนรายงานสถิติ / คีย์ชุดข้อมูลระบุผลดำเนินงาน..."
                  className={`flex-1 px-4 py-2.5 rounded-xl outline-none text-xs border ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-200 focus:border-[#FCA311]' : 'bg-slate-100 border-slate-200 text-slate-800'}`}
                />
                <button type="submit" className="p-2.5 bg-[#FCA311] text-slate-950 text-xs font-bold rounded-xl hover:bg-[#FCA311]/90" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Commit Data
                </button>
              </form>
            </div>

          </main>

          {/* ANALYTICS AI MODAL */}
          {showAiModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
              <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl bg-slate-950 border-[#FCA311]/30 text-slate-100`}>
                <h3 className="font-bold text-xs text-[#FCA311] mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>📊 ระบบประมวลผลรูปจำลองวิเคราะห์ AI</h3>
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="เช่น: highly detailed statistics flow chart, server architecture graph..."
                  rows={4}
                  className="w-full p-3 rounded-xl border border-slate-800 bg-[#000000] text-xs resize-none mb-4 focus:border-[#FCA311] outline-none text-white"
                />
                <div className="flex space-x-2">
                  <button onClick={() => setShowAiModal(false)} className="flex-1 py-3 bg-slate-900 text-xs rounded-xl border border-slate-800 text-slate-300">ยกเลิก</button>
                  <button onClick={generateAiImage} disabled={isGenerating || !aiPrompt.trim()} className="flex-1 py-3 bg-[#FCA311] text-slate-950 font-bold rounded-xl text-xs">
                    {isGenerating ? "กำลังเรนเดอร์โมเดล..." : "เรนเดอร์สตรีมข้อมูลทันที"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* EXIT COUPLING DIALOGUE */}
          {showExitConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xs">
              <div className="w-full max-w-sm p-6 rounded-3xl border shadow-2xl text-center bg-slate-950 border-[#FCA311]/30 text-white animate-fade-in">
                <div className="text-3xl mb-3 text-[#FCA311] flex justify-center">
                  <NodeIcon type="transmitter" className="w-10 h-10" />
                </div>
                <h3 className="font-bold text-sm mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>ยกเลิกแชร์สายสัญญาณเครือข่ายหลัก?</h3>
                <p className="text-[10px] text-slate-500 mb-6 font-mono">
                  ระบบจะยุติการแชร์รายงานชั่วคราวและล้างสถิติคีย์การเชื่อมต่อปัจจุบันออกจากเครื่องของคุณทันที
                </p>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setShowExitConfirm(false)}
                    className="flex-1 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white rounded-xl text-[10px] font-bold"
                  >
                    ยกเลิกคำสั่ง
                  </button>
                  <button 
                    onClick={handleConfirmExit}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-bold"
                  >
                    ยืนยันปิดวงจร
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}