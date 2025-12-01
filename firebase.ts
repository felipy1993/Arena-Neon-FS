import { initializeApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  User,
  Auth,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  Firestore,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
} from "firebase/firestore";
import {
  GameState,
  Upgrade,
  Skin,
  PlayerGlobalStats,
  GameSession,
} from "./types";

// Configuração do Firebase (Dados Reais do Projeto Arena Neon)
const firebaseConfig = {
  apiKey: "AIzaSyDtIC46fSYBhDKWbhZmubHQ1vAMck3U67s",
  authDomain: "arena-neon.firebaseapp.com",
  projectId: "arena-neon",
  storageBucket: "arena-neon.firebasestorage.app",
  messagingSenderId: "493945862852",
  appId: "1:493945862852:web:bd3ee9cc9ecf503589e791",
};

// Inicializa o Firebase com tratamento de erros
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
  console.log("✅ Firebase inicializado com sucesso");
} catch (error) {
  console.error("❌ Erro ao inicializar Firebase:", error);
}

// Interfaces de Dados para o Banco
export interface CloudSaveData {
  playerName: string;
  highScore: number;
  cash: number;
  gems: number;
  wave: number;
  upgrades: Upgrade[];
  ownedSkinIds: string[];
  selectedSkinId: string;
  lastLoginDate?: string; // Controle de recompensa diária
  loginStreak?: number; // Controle de recompensa diária
  lastSaved: any;
  // Competitive Stats
  globalStats?: PlayerGlobalStats;
  recentSessions?: GameSession[]; // últimas 10 sessions
}

// --- Helpers de Username ---

// Verifica se um nome de usuário já existe no banco
export const checkUsernameAvailability = async (
  username: string
): Promise<boolean> => {
  if (!db) return false;
  try {
    const normalizedUser = username.trim().toLowerCase();
    // Validação básica de segurança no nome
    if (normalizedUser.length < 3 || normalizedUser.length > 20) return false;

    const docRef = doc(db, "usernames", normalizedUser);
    const docSnap = await getDoc(docRef);
    return !docSnap.exists(); // Retorna TRUE se estiver disponível
  } catch (e) {
    console.error("Erro ao verificar username:", e);
    // Se der erro de permissão aqui, provavelmente as regras não foram configuradas
    throw e;
  }
};

// --- Funções de Autenticação ---

// 1. Login com Google
export const loginWithGoogle = async () => {
  if (!auth || !googleProvider) {
    throw new Error("Firebase não inicializado");
  }
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Erro no login Google:", error);
    throw error;
  }
};

// 2. Criar Conta com Email/Senha E NOME DE USUÁRIO
export const registerWithEmail = async (
  email: string,
  pass: string,
  username: string
) => {
  if (!db || !auth) throw new Error("Firebase não inicializado");

  // 1. Verificar disponibilidade do nome
  const isAvailable = await checkUsernameAvailability(username);
  if (!isAvailable) {
    throw new Error("USERNAME_TAKEN");
  }

  try {
    // 2. Criar usuário no Auth (Seguro, senha hashada pelo Google)
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    const user = result.user;

    // 3. Reservar o nome de usuário
    // Salva apenas o email e UID. A senha NUNCA é salva no banco.
    await setDoc(doc(db, "usernames", username.trim().toLowerCase()), {
      email: email,
      uid: user.uid,
    });

    // 4. Inicializar documento do usuário (Segregado por UID)
    const initialData: Partial<CloudSaveData> = {
      playerName: username.toUpperCase(),
      highScore: 0,
      cash: 150,
      gems: 0,
      wave: 1,
      lastSaved: serverTimestamp(),
      lastLoginDate: "", // Nunca logou
      loginStreak: 0,
    };
    // A regra de segurança deve garantir que só podemos escrever em /users/{meu_uid}
    await setDoc(doc(db, "users", user.uid), initialData, { merge: true });

    return user;
  } catch (error) {
    throw error;
  }
};

// 3. Entrar com Email OU Nome de Usuário
export const loginWithEmailOrUsername = async (
  identifier: string,
  pass: string
) => {
  if (!auth) throw new Error("Firebase não inicializado");

  try {
    let emailToUse = identifier;

    // Se NÃO tem @, assumimos que é um nome de usuário
    if (!identifier.includes("@")) {
      if (!db) throw new Error("Database error");

      const normalizedUser = identifier.trim().toLowerCase();
      const usernameRef = doc(db, "usernames", normalizedUser);

      try {
        const usernameSnap = await getDoc(usernameRef);
        if (!usernameSnap.exists()) {
          throw new Error("USER_NOT_FOUND");
        }
        // Pega o email associado a este nome de usuário
        emailToUse = usernameSnap.data().email;
      } catch (e: any) {
        // Se der erro de permissão, o usuário precisa configurar o Firestore
        if (e.code === "permission-denied") throw e;
        throw new Error("USER_LOOKUP_FAILED");
      }
    }

    // Faz o login normal com o email (SDK do Firebase gerencia a segurança da senha)
    const result = await signInWithEmailAndPassword(auth, emailToUse, pass);
    return result.user;
  } catch (error) {
    throw error;
  }
};

export const logoutUser = async () => {
  if (!auth) throw new Error("Firebase não inicializado");
  await signOut(auth);
};

// --- Funções de Banco de Dados ---
export const saveGameToCloud = async (
  user: User,
  gameState: GameState,
  upgrades: Upgrade[],
  playerName: string,
  highScore: number,
  globalStats?: PlayerGlobalStats,
  recentSessions?: GameSession[]
) => {
  if (!db) return false;

  // Dados a serem salvos
  const saveData: CloudSaveData = {
    playerName,
    highScore,
    cash: gameState.cash,
    gems: gameState.gems,
    wave: gameState.wave,
    upgrades,
    ownedSkinIds: gameState.ownedSkinIds,
    selectedSkinId: gameState.selectedSkinId,
    lastLoginDate: gameState.lastLoginDate || "", // Salva data atualizada
    loginStreak: gameState.loginStreak || 0,
    lastSaved: serverTimestamp(),
    globalStats,
    recentSessions,
  };

  try {
    // ESCREVENDO APENAS NO DOCUMENTO DO USUÁRIO LOGADO
    // Regra: request.auth.uid == userId
    await setDoc(doc(db, "users", user.uid), saveData, { merge: true });
    console.log("Jogo salvo na nuvem com sucesso!");
    return true;
  } catch (e) {
    console.error("Erro ao salvar na nuvem:", e);
    return false;
  }
};

export const loadGameFromCloud = async (user: User) => {
  if (!db) return null;

  try {
    // LENDO APENAS DO DOCUMENTO DO USUÁRIO LOGADO
    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as CloudSaveData;
    } else {
      console.log("Nenhum save encontrado para este usuário.");
      return null;
    }
  } catch (e) {
    console.error("Erro ao carregar da nuvem:", e);
    return null;
  }
};

// --- LEADERBOARD (Global Rankings) ---
export const updateLeaderboard = async (
  user: User,
  playerName: string,
  highScore: number,
  prestigeLevel: number = 0
) => {
  if (!db) return false;

  try {
    // Atualiza entrada no leaderboard global
    const leaderboardEntry = {
      uid: user.uid,
      playerName,
      highScore,
      prestigeLevel,
      lastUpdate: serverTimestamp(),
    };

    // Salva em uma coleção global de rankings
    await setDoc(doc(db, "leaderboard", user.uid), leaderboardEntry, {
      merge: true,
    });
    console.log("Leaderboard atualizado!");
    return true;
  } catch (e) {
    console.error("Erro ao atualizar leaderboard:", e);
    return false;
  }
};

// Carrega leaderboard global (top 50)
export const loadLeaderboard = async (
  limitCount: number = 50
): Promise<any[]> => {
  if (!db) return [];

  try {
    // Query a coleção de leaderboard, ordenada por highScore (descendente), limitada a N resultados
    const q = query(
      collection(db, "leaderboard"),
      orderBy("highScore", "desc"),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const results: any[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      results.push({
        id: doc.id,
        uid: data.uid,
        playerName: data.playerName,
        highScore: data.highScore || 0,
        prestigeLevel: data.prestigeLevel || 0,
        lastUpdate: data.lastUpdate,
      });
    });

    console.log(`✅ Leaderboard carregado com ${results.length} entradas`);
    console.log("📊 Top 3:", results.slice(0, 3));
    return results;
  } catch (e) {
    console.error("❌ Erro ao carregar leaderboard:", e);
    return [];
  }
};

export { auth };
