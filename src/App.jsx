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

// =================================================================
// 🛠️ ส่วนที่ 1: ตั้งค่าเชื่อมต่อระบบ FIREBASE (กรอกข้อมูลจริงของคุณตรงนี้)
// =================================================================
const firebaseConfig = {
  apiKey: "AIzaSyBIsrn49A16UaBPqvcOcpjnGKGH51Xi8g8",                    
  authDomain: "send-system-862c4.firebaseapp.com",
  projectId: "send-system-862c4",
  storageBucket: "send-system-862c4.appspot.com",
  messagingSenderId: "432190154593", 
  appId: "1:432190154593:web:c7c1f6c428e6e690088720"                          
};

// =================================================================
// 🚀 ส่วนที่ 2: เริ่มต้นระบบวิเคราะห์และพรางตัวทำงาน (ห้ามแก้ไขส่วนนี้)
// =================================================================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'zet-stealth-workspace';

// Node Agent Component Types (แทนอวตารเดิมด้วยไอคอนแนวเทคนิคคลีนๆ)
const NODE_AGENTS = [
  { id: 'agent_gw', name: 'Gateway_Alpha', type: '📡 G-WAY', desc: 'สถานีเชื่อมต่อเครือข่ายหลัก', color: 'border-rose-300 text-rose-600 bg-rose-50/50' },
  { id: 'agent_pr', name: 'Proxy_Gamma', type: '🛡️ PRX-Y', desc: 'ระบบป้องกันตัวตนพรางพอร์ต', color: 'border-rose-400 text-rose-700 bg-rose-50/50' },
  { id: 'agent_db', name: 'Buffer_Omega', type: '💾 DB-BUF', desc: 'โหนดจำลองพักชุดข้อมูลสถิติ', color: 'border-slate-300 text-slate-700 bg-slate-50' },
  { id: 'agent_rt', name: 'Router_Beta', type: '🔌 R-TR', desc: 'อุปกรณ์สลับแชนแนลความเร็วสูง', color: 'border-zinc-300 text-zinc-600 bg-zinc-50' },
  { id: 'agent_cp', name: 'Core_Process', type: '⚙️ CORE-P', desc: 'ตัวประมวลผลอัลกอริทึมวงจร', color: 'border-rose-500 text-rose-800 bg-rose-50/50' },
  { id: 'agent_sk', name: 'Secure_Socket', type: '🔒 S-KT', desc: 'ช่องทางส่งรหัสโครงสร้างปิด', color: 'border-slate-400 text-slate-800 bg-slate-100' }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [operatorId, setOperatorId] = useState('');
  const [selectedAgent, setSelectedAgent] = useState(NODE_AGENTS[0]);
  const [projectKeyInput, setProjectKeyInput] = useState('');
  
  const [isMounted, setIsMounted] = useState(false);
  const [projectKey, setProjectKey] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // ล็อคหน้าจอสำหรับผู้ที่เคยเข้าระบบมาแล้ว (Passcode Screen)
  const [isRestoringSession, setIsRestoringSession] = useState(true);
  const [savedProfile, setSavedProfile] = useState(null);
  const [passcodeAttempt, setPasscodeAttempt] = useState('');
  
  // ข้อมูลเรียลไทม์
  const [payloads, setPayloads] = useState([]);
  const [activeNodes, setActiveNodes] = useState([]);
  const [activeChannel, setActiveChannel] = useState('global_registry'); // 'global_registry' หรือ 'userId'
  const [favoriteNodes, setFavoriteNodes] = useState([]); // เก็บรายการ ID ที่ถูกใจ
  
  // อินพุตและสถานะการส่งสัญญาณ (Typing Indicator)
  const [inputPayload, setInputPayload] = useState('');
  const [isProcessingInput, setIsProcessingInput] = useState(false);
  const [processingTimeout, setProcessingTimeout] = useState(null);

  // ระบบประมวลผลกราฟิก (Compute Visual Modal)
  const [showRenderModal, setShowRenderModal] = useState(false);
  const [renderPrompt, setRenderPrompt] = useState('');
  const [isRendering, setIsRendering] = useState(false);

  // สถานะ Custom Dialog ยืนยันการตัดการเชื่อมต่อ
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // แจ้งเตือนสไตล์แถบสถานะเซิร์ฟเวอร์
  const [systemAlert, setSystemAlert] = useState('');
  const filePayloadRef = useRef(null);
  const logsEndRef = useRef(null);

  // แสดงระบบ Alert
  const triggerAlert = (msg) => {
    setSystemAlert(msg);
    setTimeout(() => setSystemAlert(''), 4000);
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Firebase auth check failed:", err);
        triggerAlert("ไม่สามารถซิงค์ข้อมูลกับคลาวด์ได้ กรุณาตรวจสอบการตั้งค่า Firebase");
        setIsRestoringSession(false);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, async (usr) => {
      if (usr) {
        setUser(usr);
        
        try {
          const profileDocRef = doc(db, 'artifacts', appId, 'users', usr.uid, 'profile', 'user_info');
          const profileSnap = await getDoc(profileDocRef);
          
          if (profileSnap.exists()) {
            const data = profileSnap.data();
            if (data.operatorId && data.projectKey) {
              setSavedProfile(data);
              setOperatorId(data.operatorId);
              const matchedAgent = NODE_AGENTS.find(ag => ag.id === data.agent?.id);
              if (matchedAgent) setSelectedAgent(matchedAgent);
            }
          }

          // ดึงข้อมูลแชทโปรด (Favorites)
          const favDocRef = doc(db, 'artifacts', appId, 'users', usr.uid, 'config', 'favorites');
          const favSnap = await getDoc(favDocRef);
          if (favSnap.exists()) {
            setFavoriteNodes(favSnap.data().items || []);
          }

        } catch (err) {
          console.error("Error reading setup profile:", err);
        }
      }
      setIsRestoringSession(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsMounted(false);
        setPasscodeAttempt('');
        setPayloads([]); // ล้างหน่วยความจำทันทีเพื่อความปลอดภัยสูง
        triggerAlert("ระบบตรวจพบการย่อแอป/สลับจอ: บล็อกสัญญาณและล็อคโหนดทันที");
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (!user || !isMounted) {
      setPayloads([]);
      return;
    }

    const payloadsCollection = collection(db, 'artifacts', appId, 'public', 'data', 'messages');
    const unsubPayloads = onSnapshot(payloadsCollection, (snapshot) => {
      const pList = [];
      snapshot.forEach((doc) => {
        pList.push({ id: doc.id, ...doc.data() });
      });
      pList.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      setPayloads(pList);
    }, (error) => {
      console.error("Payload subscription failed:", error);
    });

    const usersCollection = collection(db, 'artifacts', appId, 'public', 'data', 'users');
    const unsubUsers = onSnapshot(usersCollection, (snapshot) => {
      const uList = [];
      snapshot.forEach((doc) => {
        uList.push({ id: doc.id, ...doc.data() });
      });
      setActiveNodes(uList);
    }, (error) => {
      console.error("Active node synchronization failed:", error);
    });

    return () => {
      unsubPayloads();
      unsubUsers();
    };
  }, [user, isMounted]);

  useEffect(() => {
    if (!user || !isMounted) return;

    const dispatchHeartbeat = async () => {
      try {
        const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
        await setDoc(userDocRef, {
          uid: user.uid,
          username: operatorId,
          avatar: selectedAgent,
          roomKey: projectKey,
          lastActive: Date.now(),
          typingTo: isProcessingInput ? activeChannel : null
        }, { merge: true });
      } catch (err) {
        console.error("Failed to post heartbeat:", err);
      }
    };

    dispatchHeartbeat();
    const timer = setInterval(dispatchHeartbeat, 6000);
    return () => clearInterval(timer);
  }, [user, isMounted, operatorId, selectedAgent, projectKey, isProcessingInput, activeChannel]);

  const scrollToLatestLog = () => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToLatestLog();
  }, [payloads, activeChannel]);

  const handleVerifyPasscode = (e) => {
    e.preventDefault();
    if (passcodeAttempt === savedProfile.projectKey) {
      setProjectKey(savedProfile.projectKey);
      setIsMounted(true);
      triggerAlert("ถอดรหัสแพกเก็ตสำเร็จ เข้าสู่ชุดคำสั่งควบคุม...");
    } else {
      triggerAlert("คีย์ถอดรหัสวงจรไม่ถูกต้อง ปฏิเสธการเข้าถึง!");
      setPasscodeAttempt('');
    }
  };

  const handleCreateNode = async (e) => {
    e.preventDefault();
    if (!operatorId.trim()) {
      triggerAlert("กรุณาระบุรหัสผู้ปฏิบัติงาน (Operator ID)");
      return;
    }
    if (!projectKeyInput.trim()) {
      triggerAlert("กรุณาระบุรหัสชุดงาน / คีย์สถิติวงจร");
      return;
    }

    const key = projectKeyInput.trim();
    setProjectKey(key);
    setIsMounted(true);

    if (user) {
      try {
        const profileDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'user_info');
        await setDoc(profileDocRef, {
          operatorId: operatorId.trim(),
          projectKey: key,
          agent: selectedAgent,
          updatedAt: Date.now()
        }, { merge: true });
      } catch (err) {
        console.error("Cannot store settings profile:", err);
      }
    }
    triggerAlert("เชื่อมต่อโหนดและเริ่มรันระบบสำเร็จ!");
  };

  const handleDisconnectNode = async () => {
    setIsMounted(false);
    setSavedProfile(null);
    setProjectKey('');
    setProjectKeyInput('');
    setOperatorId('');
    setPayloads([]);
    
    if (user) {
      try {
        const profileDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'user_info');
        await setDoc(profileDocRef, {
          operatorId: '',
          projectKey: '',
          agent: selectedAgent,
          updatedAt: Date.now()
        }, { merge: true });
      } catch (err) {
        console.error("Error erasing workspace profile:", err);
      }
    }
    setShowExitConfirm(false);
    triggerAlert("ตัดการเชื่อมต่อเครือข่ายและล้างข้อมูลเรียบร้อย");
  };

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 1000;  // บีบอัดสัดส่วนความละเอียดให้พอเหมาะและมีระดับ
          const MAX_HEIGHT = 1000;
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
          ctx.drawImage(img, 0, 0, width, height);
          
          // แปลงไฟล์เป็น JPEG สัดส่วนบีบอัดคุณภาพสูงและประหยัดพื้นที่คลาวด์ (0.7 Quality)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
          resolve(compressedDataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleCommitPayload = async (e, customText = null, customImg = null, isAi = false) => {
    if (e) e.preventDefault();

    const textToCommit = customText !== null ? customText : inputPayload;
    const imgToCommit = customImg !== null ? customImg : null;

    if (!textToCommit.trim() && !imgToCommit) return;
    if (!user) {
      triggerAlert("กรุณารอสักครู่ กำลังจัดตั้งเสาอากาศเชื่อมโยง...");
      return;
    }

    try {
      const dataPacket = {
        senderId: user.uid,
        senderName: operatorId,
        senderAvatar: selectedAgent,
        roomKey: projectKey,
        text: textToCommit,
        imageUrl: imgToCommit,
        isAiGenerated: isAi,
        recipientId: activeChannel,
        timestamp: Date.now()
      };

      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'messages'), dataPacket);
      if (!customText && !customImg) {
        setInputPayload('');
      }

      setIsProcessingInput(false);
      const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
      await setDoc(userDocRef, { typingTo: null }, { merge: true });

    } catch (err) {
      console.error("Error submitting commit log:", err);
      triggerAlert("ส่งไม่สำเร็จ กรุณาตรวจสอบการตั้งค่า Firebase Rules");
    }
  };

  const handlePayloadInput = (e) => {
    setInputPayload(e.target.value);

    if (!isProcessingInput) {
      setIsProcessingInput(true);
    }

    if (processingTimeout) clearTimeout(processingTimeout);

    const timeout = setTimeout(async () => {
      setIsProcessingInput(false);
      if (user) {
        const userDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'users', user.uid);
        await setDoc(userDocRef, { typingTo: null }, { merge: true });
      }
    }, 2000);

    setProcessingTimeout(timeout);
  };

  const handleFileAttach = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      triggerAlert("โปรดเลือกไฟล์ชนิดกราฟิกที่ถูกต้อง");
      return;
    }

    triggerAlert("🔄 กำลังเตรียมโครงสร้างสตรีมไฟล์กราฟิก...");

    try {
      // บีบอัดไฟล์ภาพดิบระดับสูงจากมือถือได้ทันที ไร้ขีดจำกัดขนาดไฟล์!
      const compressedBase64 = await compressImage(file);
      await handleCommitPayload(null, "📁 สตรีมไฟล์กราฟิกเสร็จสิ้น", compressedBase64, false);
      triggerAlert("✅ ส่งไฟล์กราฟิกสำเร็จ!");
    } catch (err) {
      console.error(err);
      triggerAlert("❌ การประมวลผลไฟล์ภาพล้มเหลว");
    }
    e.target.value = '';
  };

  const toggleFavorite = async (targetId) => {
    let updated = [...favoriteNodes];
    if (updated.includes(targetId)) {
      updated = updated.filter(id => id !== targetId);
    } else {
      updated.push(targetId);
    }
    setFavoriteNodes(updated);
    
    if (user) {
      try {
        const favDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'config', 'favorites');
        await setDoc(favDocRef, { items: updated }, { merge: true });
      } catch (err) {
        console.error("Failed to update config favorites:", err);
      }
    }
  };

  const executeGraphicCompute = async () => {
    if (!renderPrompt.trim()) {
      triggerAlert("กรุณาระบุคีย์เวิร์ดโครงสร้างสำหรับการวาด");
      return;
    }

    setIsRendering(true);
    const apiKey = ""; 

    const requestCompute = async (retries = 5, delay = 1000) => {
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instances: { prompt: renderPrompt },
            parameters: { sampleCount: 1 }
          })
        });

        if (!response.ok) throw new Error("API Failure");

        const resData = await response.json();
        if (resData.predictions && resData.predictions[0]?.bytesBase64Encoded) {
          return `data:image/png;base64,${resData.predictions[0].bytesBase64Encoded}`;
        } else {
          throw new Error("Bad model output structure");
        }
      } catch (err) {
        if (retries > 0) {
          await new Promise(res => setTimeout(res, delay));
          return requestCompute(retries - 1, delay * 2);
        }
        throw err;
      }
    };

    try {
      const base64Data = await requestCompute();
      await handleCommitPayload(null, `⚙️ เรนเดอร์แผนภาพวิเคราะห์จากคำสั่ง: "${renderPrompt}"`, base64Data, true);
      setShowRenderModal(false);
      setRenderPrompt('');
      triggerAlert("ประมวลผลโมเดลและเผยแพร่ข้อมูลสำเร็จ!");
    } catch (err) {
      console.error(err);
      triggerAlert("เกิดข้อผิดพลาดในการประมวลผลกราฟิก กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsRendering(false);
    }
  };

  const activeOnlineOperators = useMemo(() => {
    const cutoff = Date.now() - 20000;
    return activeNodes.filter(n => n.roomKey === projectKey && n.lastActive > cutoff);
  }, [activeNodes, projectKey]);

  const sortedAndFilteredPayloads = useMemo(() => {
    return payloads.filter(p => {
      if (p.roomKey !== projectKey) return false;
      if (activeChannel === 'global_registry') {
        return p.recipientId === 'global_registry';
      } else {
        return (
          (p.senderId === user?.uid && p.recipientId === activeChannel) ||
          (p.senderId === activeChannel && p.recipientId === user?.uid)
        );
      }
    });
  }, [payloads, projectKey, activeChannel, user]);

  const activeChannelName = useMemo(() => {
    if (activeChannel === 'global_registry') return 'คลังบันทึกข้อมูลหลัก (Global DB Registry)';
    const target = activeOnlineOperators.find(n => n.uid === activeChannel);
    return target ? `ลิงก์ส่งข้อมูลวงจร (Direct: ${target.username})` : 'ช่องเชื่อมต่อสำรอง';
  }, [activeChannel, activeOnlineOperators]);

  const activeInputStatus = useMemo(() => {
    if (activeChannel === 'global_registry') {
      const usersTyping = activeOnlineOperators.filter(n => n.uid !== user?.uid && n.typingTo === 'global_registry');
      if (usersTyping.length === 1) return `โหนด ${usersTyping[0].username} กำลังป้อนคีย์พัสดุ...`;
      if (usersTyping.length > 1) return `มีโหนดปลายทางจำนวน ${usersTyping.length} โหนด กำลังเขียนข้อมูล...`;
    } else {
      const target = activeOnlineOperators.find(n => n.uid === activeChannel);
      if (target && (target.typingTo === user?.uid || target.typingTo === 'global_registry')) {
        return `โหนด ${target.username} กำลังวิเคราะห์และป้อนข้อความ...`;
      }
    }
    return null;
  }, [activeOnlineOperators, activeChannel, user]);

  if (isRestoringSession) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-6">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 border-4 border-rose-100 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-rose-500 rounded-full animate-spin"></div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-rose-600 text-xs font-mono tracking-[0.25em] uppercase font-bold">SYSTEM RESTORING</p>
          <p className="text-slate-500 text-[10px] font-mono">กำลังกู้คืนข้อมูลโครงสร้างโหนดล่าสุด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen h-[100dvh] font-sans bg-slate-50 text-slate-800 flex flex-col overflow-hidden select-none">
      
      {/* แจ้งเตือนสไตล์แถบสถานะเซิร์ฟเวอร์แบบบางเฉียบ */}
      {systemAlert && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center bg-white border border-rose-100 text-slate-800 px-5 py-2.5 rounded-full shadow-lg space-x-3 animate-fade-in font-mono text-xs max-w-[90vw] text-center">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span className="truncate">{systemAlert}</span>
        </div>
      )}

      {!isMounted ? (
        savedProfile ? (
          // ================= PASSCODE LOCK SCREEN (เข้าใช้อีกครั้งกรอกพาสโค้ดอย่างเดียว) =================
          <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-50">
            <div className="w-full max-w-sm p-6 rounded-3xl bg-white border border-rose-100 shadow-md">
              
              <div className="text-center mb-6">
                <div className="inline-flex p-3 rounded-2xl bg-rose-50 border border-rose-100 mb-3 text-rose-500">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h1 className="text-lg font-bold tracking-wider text-rose-600 font-mono uppercase">🔑 DECRYPTION MOUNT</h1>
                <p className="text-xs text-slate-500 mt-1 font-mono">กรุณาระบุรหัสผ่านเพื่อติดตั้งโหนดวงจรเดิม</p>
              </div>

              <form onSubmit={handleVerifyPasscode} className="space-y-5">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center text-xs font-mono font-bold">
                      OP
                    </div>
                    <div>
                      <p className="text-[9px] text-slate-400 font-mono">ผู้ปฏิบัติงาน</p>
                      <p className="text-xs font-semibold text-slate-700 font-mono">{savedProfile.operatorId}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 font-mono uppercase">
                    {savedProfile.agent?.type}
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                    คีย์สถิติวงจร (Project Node Key)
                  </label>
                  <input
                    type="password"
                    value={passcodeAttempt}
                    onChange={(e) => setPasscodeAttempt(e.target.value)}
                    placeholder="รหัสผ่านเพื่อติดตั้งโหนด"
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:border-rose-400 focus:bg-white text-slate-800 outline-none font-mono text-center text-base tracking-widest transition-all"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-mono text-xs font-bold tracking-wider transition-all shadow-md active:scale-[0.98]"
                >
                  MOUNT DATA STATION
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={handleDisconnectNode}
                    className="text-xs text-rose-400 hover:text-rose-500 font-mono underline transition-colors"
                  >
                    ลบประวัติเซสชันระบบและเปลี่ยนบัญชีอื่น
                  </button>
                </div>
              </form>

            </div>
          </div>
        ) : (
          // ================= INITIAL SIGN-UP SCREEN (หน้าพรางตัวลงทะเบียนครั้งแรก) =================
          <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-50">
            <div className="w-full max-w-sm p-6 rounded-3xl bg-white border border-rose-100 shadow-md">
              
              <div className="text-center mb-6">
                <div className="inline-flex p-3 rounded-2xl bg-rose-50 border border-rose-100 mb-3 text-rose-500">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <h1 className="text-xl font-bold tracking-wider text-rose-600 font-mono">ZET DATA WORKSPACE</h1>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">ชุดโหนดวิเคราะห์สถิติมัลติแทสก์ความปลอดภัยระดับสูง</p>
              </div>

              <form onSubmit={handleCreateNode} className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] font-mono uppercase tracking-wider text-slate-500 mb-1">
                      รหัสผู้ปฏิบัติงาน (Operator ID)
                    </label>
                    <input
                      type="text"
                      maxLength={14}
                      value={operatorId}
                      onChange={(e) => setOperatorId(e.target.value)}
                      placeholder="เช่น OPT_992"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-rose-400 focus:bg-white text-slate-800 outline-none font-mono text-xs transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-mono uppercase tracking-wider text-slate-500 mb-1">
                      คีย์สถิติวงจร (Project Node Key)
                    </label>
                    <input
                      type="password"
                      value={projectKeyInput}
                      onChange={(e) => setProjectKeyInput(e.target.value)}
                      placeholder="รหัสผ่านเชื่อมต่อวงจร"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-rose-400 focus:bg-white text-slate-800 outline-none font-mono text-xs transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-mono uppercase tracking-wider text-slate-500 mb-1">
                    โหนดระบบจำลอง (Node Agent Components)
                  </label>
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                    {NODE_AGENTS.map((agent) => (
                      <button
                        key={agent.id}
                        type="button"
                        onClick={() => setSelectedAgent(agent)}
                        className={`p-2 rounded-xl border text-left transition-all flex flex-col justify-between h-14 ${
                          selectedAgent.id === agent.id
                            ? 'bg-rose-50/50 border-rose-400 ring-1 ring-rose-400'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-[10px] font-bold font-mono text-rose-600 truncate">{agent.name}</span>
                        <p className="text-[8px] text-slate-400 font-mono leading-none">{agent.type}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-mono text-xs font-bold tracking-wider transition-all shadow-md"
                >
                  MOUNT DATA NETWORK
                </button>
              </form>

            </div>
          </div>
        )
      ) : (
        // ================= MAIN STEALTH WORKSPACE (ห้องแชทสไตล์ระบบควบคุมข้อมูล) =================
        <div className="flex-1 flex h-full overflow-hidden relative">

          {/* แผงควบคุมระบบด้านซ้าย (Left Sidebar - optimized responsive drawer) */}
          <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-72 transition-transform duration-300 ease-in-out transform lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
          } bg-white border-r border-slate-100 flex flex-col h-full`}>
            
            {/* Operator Active Node Tag */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 font-mono text-xs font-bold">
                  OPT
                </div>
                <div>
                  <h3 className="text-[9px] font-mono text-rose-500 uppercase tracking-wider font-bold">Node Mounted</h3>
                  <p className="font-bold text-xs text-slate-700 font-mono max-w-[120px] truncate">{operatorId}</p>
                </div>
              </div>
              
              <button
                onClick={() => setShowExitConfirm(true)}
                className="p-1.5 rounded-lg border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all font-mono text-[9px] font-bold"
              >
                UNMOUNT
              </button>
            </div>

            {/* Current Shared Project Key Info */}
            <div className="p-4 shrink-0">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-mono text-slate-400 uppercase font-bold">SYS_MOUNT_CODE</span>
                  <span className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 text-[8px] font-mono border border-rose-100 font-bold">ACTIVE</span>
                </div>
                <div className="font-mono font-bold text-xs flex items-center justify-between text-rose-600">
                  <span>{projectKey}</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(projectKey);
                      triggerAlert("คัดลอกคีย์วงจรระบบเรียบร้อย!");
                    }}
                    className="hover:scale-110 active:scale-90 transition-all p-1.5 rounded bg-white border border-slate-200"
                    title="Copy Key Link"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* NAVIGATION REGISTRIES */}
            <div className="flex-1 overflow-y-auto px-2 space-y-4 pb-4">
              
              {/* FAVOURITES CHANNELS PINS (⭐⭐⭐) */}
              {favoriteNodes.length > 0 && (
                <div>
                  <h4 className="px-3 text-[9px] font-mono text-rose-500 uppercase tracking-wider mb-1.5 font-bold flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Priority Data Streams
                  </h4>
                  <div className="space-y-1">
                    {favoriteNodes.includes('global_registry') && (
                      <button
                        onClick={() => { setActiveChannel('global_registry'); setSidebarOpen(false); }}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${
                          activeChannel === 'global_registry'
                            ? 'bg-rose-50 border border-rose-200 text-rose-700 shadow-xs'
                            : 'hover:bg-slate-50 border border-transparent text-slate-500'
                        }`}
                      >
                        <span className="text-xs font-mono font-bold flex items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-2" />
                          📊 Global Data-DB
                        </span>
                        <span className="text-[8px] text-rose-600 bg-rose-100/50 px-1.5 py-0.5 rounded font-mono font-bold">PRIO</span>
                      </button>
                    )}

                    {activeOnlineOperators
                      .filter(u => u.uid !== user?.uid && favoriteNodes.includes(u.uid))
                      .map(u => (
                        <button
                          key={u.uid}
                          onClick={() => { setActiveChannel(u.uid); setSidebarOpen(false); }}
                          className={`w-full flex items-center justify-between p-2.5 rounded-xl transition-all ${
                            activeChannel === u.uid
                              ? 'bg-rose-50 border border-rose-200 text-rose-700 shadow-xs'
                              : 'hover:bg-slate-50 border border-transparent text-slate-500'
                          }`}
                        >
                          <span className="text-xs font-mono font-bold flex items-center truncate max-w-[120px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-2" />
                            📡 {u.username}
                          </span>
                          <span className="text-[8px] text-rose-600 bg-rose-100/50 px-1.5 py-0.5 rounded font-mono font-bold">PRIO</span>
                        </button>
                    ))}
                  </div>
                </div>
              )}

              {/* GLOBAL REGISTRY CHANNELS */}
              <div>
                <h4 className="px-3 text-[9px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 font-bold">DATASTREAM REGISTRIES</h4>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => { setActiveChannel('global_registry'); setSidebarOpen(false); }}
                    className={`flex-1 flex items-center justify-between p-2.5 rounded-xl transition-all ${
                      activeChannel === 'global_registry'
                        ? 'bg-rose-50 border border-rose-100 text-rose-700 font-bold'
                        : 'hover:bg-slate-50 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                      </svg>
                      <span className="text-xs font-mono">Global DB Register</span>
                    </div>
                  </button>
                  <button 
                    onClick={() => toggleFavorite('global_registry')}
                    className={`p-2.5 rounded-xl hover:bg-slate-50 transition-all ${
                      favoriteNodes.includes('global_registry') ? 'text-rose-500' : 'text-slate-300'
                    }`}
                  >
                    <svg className="w-4 h-4" fill={favoriteNodes.includes('global_registry') ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.25.582 1.828l-3.97 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.887a1 1 0 00-1.176 0l-3.97 2.887c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.97-2.888c-.784-.578-.38-1.828.582-1.828h4.907a1 1 0 00.95-.69l1.519-4.674z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* ACTIVE NETWORK TARGETS (ONLINE 1-on-1) */}
              <div>
                <div className="px-3 flex items-center justify-between mb-1.5">
                  <h4 className="text-[9px] font-mono text-slate-400 uppercase tracking-wider font-bold">ONLINE TERMINALS ({activeOnlineOperators.filter(u => u.uid !== user?.uid).length})</h4>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                </div>

                <div className="space-y-1">
                  {activeOnlineOperators.filter(u => u.uid !== user?.uid).length === 0 ? (
                    <div className="p-4 text-center rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-mono">ไม่มีโหนดวิเคราะห์อื่นออนไลน์ร่วม</p>
                      <p className="text-[8px] text-slate-400 font-mono mt-1 leading-normal">แบ่งปันพอร์ตวงจร "{projectKey}" เพื่อสร้างลิงก์การทำงานสตรีมร่วมกัน</p>
                    </div>
                  ) : (
                    activeOnlineOperators
                      .filter(u => u.uid !== user?.uid)
                      .map((u) => (
                        <div key={u.uid} className="flex items-center space-x-1">
                          <button
                            onClick={() => { setActiveChannel(u.uid); setSidebarOpen(false); }}
                            className={`flex-1 flex items-center justify-between p-2 rounded-xl transition-all ${
                              activeChannel === u.uid
                                ? 'bg-rose-50 border border-rose-100 text-rose-700 shadow-xs'
                                : 'hover:bg-slate-50 text-slate-500'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5 truncate">
                              <div className="w-7 h-7 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-mono text-rose-500 font-bold shrink-0">
                                GW
                              </div>
                              <div className="text-left truncate">
                                <p className="text-xs font-mono font-bold truncate text-slate-700">{u.username}</p>
                                <span className="text-[9px] text-rose-500 font-mono font-medium">● CONNECTED</span>
                              </div>
                            </div>
                            
                            <span className="text-[8px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                              {u.avatar?.type || 'ND-1'}
                            </span>
                          </button>
                          
                          <button 
                            onClick={() => toggleFavorite(u.uid)}
                            className={`p-2 rounded-xl hover:bg-slate-50 transition-all ${
                              favoriteNodes.includes(u.uid) ? 'text-rose-500' : 'text-slate-300'
                            }`}
                          >
                            <svg className="w-4 h-4" fill={favoriteNodes.includes(u.uid) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.25.582 1.828l-3.97 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.887a1 1 0 00-1.176 0l-3.97 2.887c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.97-2.888c-.784-.578-.38-1.828.582-1.828h4.907a1 1 0 00.95-.69l1.519-4.674z" />
                            </svg>
                          </button>
                        </div>
                      ))
                  )}
                </div>
              </div>

            </div>

            {/* Sidebar Bottom Technical Info */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 text-right shrink-0">
              <span className="text-[9px] font-mono text-rose-500 block uppercase tracking-wider font-bold">ZET DECRYPTION TOOL_V2</span>
              <span className="text-[8px] font-mono text-slate-400 block">ENCRYPTION ENGINE ACTIVE</span>
            </div>

          </aside>

          {/* BACKDROP FOR MOBILE SIDEBAR OPEN */}
          {sidebarOpen && (
            <div 
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-30 bg-slate-900/45 backdrop-blur-xs lg:hidden"
            />
          )}

          {/* WORKSPACE LOG STREAM PANEL */}
          <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-50">
            
            {/* WORKSPACE PANEL HEADER */}
            <header className="px-4 py-3 border-b border-slate-100 bg-white flex items-center justify-between shrink-0 min-h-[56px]">
              
              <div className="flex items-center space-x-3 max-w-[65%]">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2.5 rounded-xl lg:hidden text-slate-500 hover:bg-slate-100 hover:text-rose-500 transition-colors border border-slate-200 min-w-[42px] min-h-[42px] flex items-center justify-center"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>

                <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500 font-mono text-xs font-bold shrink-0">
                  LOG
                </div>
                <div className="truncate">
                  <h2 className="font-bold text-xs lg:text-sm font-mono text-slate-700 truncate">{activeChannelName}</h2>
                  <div className="flex items-center space-x-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-[8px] lg:text-[9px] text-slate-400 font-mono">MONITORING SYSTEM ACTIVE</span>
                  </div>
                </div>
              </div>

              {/* RENDER GRAPHICS ENGINE TRIGGER */}
              <button
                onClick={() => setShowRenderModal(true)}
                className="px-3.5 py-2.5 bg-rose-600 text-white text-[10px] font-bold font-mono rounded-xl hover:bg-rose-700 active:scale-95 transition-all flex items-center space-x-1.5 shadow-sm min-h-[42px]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">ENGINE RENDER</span>
              </button>

            </header>

            {/* PAYLOAD LOG STREAM CONTAINER */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 scrollbar-thin">
              {sortedAndFilteredPayloads.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto space-y-4 px-4">
                  <div className="p-4 rounded-full bg-white border border-rose-100 flex items-center justify-center text-rose-500 shadow-xs">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-mono text-sm font-bold text-rose-600 uppercase tracking-wider">No Active Payload Stream</h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-2 leading-relaxed">
                      ไม่พบบันทึกโครงสร้างชุดข้อมูลในแชนแนลปัจจุบัน ตารางข้อมูลสถิติจะอัปเดตเรียลไทม์เมื่อมีการประมวลผลคำสั่ง Commit จากผู้ปฏิบัติงานภายนอก
                    </p>
                  </div>
                </div>
              ) : (
                sortedAndFilteredPayloads.map((log, i) => {
                  const isSelf = log.senderId === user?.uid;
                  return (
                    <div 
                      key={log.id || i} 
                      className={`flex items-start space-x-2.5 ${isSelf ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isSelf && (
                        <div className="w-8 h-8 rounded border border-rose-100 bg-rose-50/30 flex items-center justify-center text-[9px] font-mono text-rose-600 font-bold shrink-0" title={log.senderName}>
                          {log.senderAvatar?.type || 'ND'}
                        </div>
                      )}

                      <div className={`flex flex-col max-w-[85%] lg:max-w-[70%] ${isSelf ? 'items-end' : 'items-start'}`}>
                        
                        {!isSelf && activeChannel === 'global_registry' && (
                          <span className="text-[8px] text-slate-400 font-mono mb-1 font-bold">
                            SRC_NODE: {log.senderName} ({log.senderAvatar?.name})
                          </span>
                        )}

                        <div className={`rounded-2xl p-3 border shadow-xs ${
                          isSelf 
                            ? 'bg-rose-500 border-rose-600 text-white rounded-tr-none' 
                            : 'bg-white border-slate-100 text-slate-700 rounded-tl-none'
                        }`}>
                          {log.imageUrl && (
                            <div className="mb-2 overflow-hidden rounded-xl border border-slate-100 bg-slate-50 max-w-full">
                              <img 
                                src={log.imageUrl} 
                                alt="Signal payload asset" 
                                className="max-w-full h-auto max-h-64 object-contain rounded-lg mx-auto"
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            </div>
                          )}

                          <p className="text-xs font-mono leading-relaxed break-words whitespace-pre-wrap">{log.text}</p>
                          
                          <div className={`text-[8px] font-mono text-right mt-1.5 uppercase ${
                            isSelf ? 'text-rose-100' : 'text-slate-400'
                          }`}>
                            UTC_SYNC: {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                        </div>

                      </div>

                    </div>
                  );
                })
              )}
              <div ref={logsEndRef} />
            </div>

            {/* REAL-TIME PAYLOAD INPUT MONITOR */}
            {activeInputStatus && (
              <div className="px-4 py-2 text-[10px] bg-rose-50/50 border-t border-rose-100 text-rose-600 font-mono flex items-center space-x-2 shrink-0">
                <span className="flex h-1.5 w-1.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500" />
                </span>
                <span className="animate-pulse">{activeInputStatus}</span>
              </div>
            )}

            {/* PAYLOAD COMPOSE CONSOLE (กล่องส่งพรางตาสไตล์ Touch-optimized) */}
            <div className="p-3 border-t border-slate-100 bg-white shrink-0">
              <form onSubmit={handleCommitPayload} className="flex items-center space-x-2 max-w-5xl mx-auto">
                
                <input
                  type="file"
                  accept="image/*"
                  ref={filePayloadRef}
                  onChange={handleFileAttach}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => filePayloadRef.current?.click()}
                  className="p-3 bg-slate-50 hover:bg-rose-50 border border-slate-200 text-slate-500 hover:text-rose-600 rounded-xl transition-all min-w-[44px] min-h-[44px] flex items-center justify-center shrink-0"
                  title="Attach Payload Asset"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>

                <input
                  type="text"
                  value={inputPayload}
                  onChange={handlePayloadInput}
                  placeholder="ป้อนชุดข้อมูลคำสั่ง (Commit payload logging...)"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:border-rose-400 focus:bg-white text-slate-800 outline-none font-mono text-xs transition-all min-h-[44px]"
                />

                <button
                  type="submit"
                  disabled={!inputPayload.trim()}
                  className={`p-3 rounded-xl font-mono text-xs font-bold transition-all flex items-center space-x-1.5 min-h-[44px] ${
                    inputPayload.trim() 
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-200 active:scale-95' 
                      : 'bg-slate-100 text-slate-300 border border-slate-200 cursor-not-allowed'
                  }`}
                >
                  <span>COMMIT</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>

              </form>
            </div>

          </main>

          {/* AI COMPUTE ENGINE MODAL */}
          {showRenderModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
              <div className="w-full max-w-sm p-5 rounded-3xl border border-rose-100 bg-white text-slate-800 shadow-2xl">
                
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 rounded-lg bg-rose-50 border border-rose-100 text-rose-500">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-xs font-mono text-rose-600 uppercase tracking-wider">GRAPHICS COMPUTE</h3>
                      <p className="text-[8px] text-slate-400 font-mono">คำนวณกราฟเรนเดอร์โมเดลจำลองด้วย AI</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowRenderModal(false)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 font-mono text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[8px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
                      พารามิเตอร์เรนเดอร์ภาพ (Prompt Command)
                    </label>
                    <textarea
                      value={renderPrompt}
                      onChange={(e) => setRenderPrompt(e.target.value)}
                      placeholder="เช่น: global network traffic data grid visualization, neon gold lines on pitch black..."
                      rows={3}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none focus:border-rose-400 focus:bg-white text-xs font-mono text-slate-700 resize-none transition-all"
                      disabled={isRendering}
                    />
                    <p className="text-[8px] text-rose-500 font-mono mt-1">
                      * คำแนะนำ: ป้อนเป็นคีย์เวิร์ดภาษาอังกฤษเพื่อความแม่นยำสูงสุด
                    </p>
                  </div>

                  <div className="flex space-x-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowRenderModal(false)}
                      className="flex-1 py-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-500 rounded-xl font-mono text-[9px] font-bold"
                      disabled={isRendering}
                    >
                      ABORT
                    </button>
                    <button
                      type="button"
                      onClick={executeGraphicCompute}
                      disabled={isRendering || !renderPrompt.trim()}
                      className={`flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-mono text-[9px] font-bold rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
                        isRendering || !renderPrompt.trim() ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isRendering ? (
                        <>
                          <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <span>COMPUTING...</span>
                        </>
                      ) : (
                        <span>RUN RENDER SYSTEM</span>
                      )}
                    </button>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* CUSTOM TERMINATION DIALOG */}
          {showExitConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md">
              <div className="w-full max-w-xs p-5 rounded-3xl border border-rose-100 bg-white text-slate-800 text-center shadow-xl">
                <div className="w-11 h-11 rounded-full bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-3.5 text-rose-500">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="font-mono text-xs font-bold text-rose-600 uppercase tracking-wider mb-2">Disconnect Connection?</h3>
                <p className="text-[9px] text-slate-500 font-mono mb-5 leading-relaxed">
                  คุณกำลังจะสั่งถอดถอนและตัดโครงข่ายการส่งข้อมูลของโหนดปัจจุบัน ระบบจะทำการเคลียร์ประวัติและล้างสถานะล็อกอินบนคลาวด์เพื่อความปลอดภัยสูงสุด
                </p>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setShowExitConfirm(false)}
                    className="flex-1 py-2.5 bg-slate-50 border border-slate-200 text-slate-500 font-mono text-[9px] font-bold rounded-xl"
                  >
                    CANCEL
                  </button>
                  <button 
                    onClick={handleDisconnectNode}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-mono text-[9px] font-bold rounded-xl"
                  >
                    UNMOUNT NOW
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
