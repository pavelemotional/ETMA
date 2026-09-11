import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User, StudyProgress } from '../types';

const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [newPosition, setNewPosition] = useState('');
  const [userStats, setUserStats] = useState<Record<string, { studied: number; learned: number }>>({});

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const usersData = snap.docs.map(d => ({ id: d.id, ...d.data() } as User));
      setUsers(usersData);

      const progSnap = await getDocs(collection(db, 'progress'));
      const allProgress = progSnap.docs.map(d => ({ id: d.id, ...d.data() } as StudyProgress));
      
      const stats: Record<string, { studied: number; learned: number }> = {};
      usersData.forEach(user => {
        const userProg = allProgress.filter(p => p.userId === user.id);
        stats[user.id] = {
          studied: userProg.length,
          learned: userProg.filter(p => p.isLearned).length,
        };
      });
      setUserStats(stats);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) return;
    
    try {
      await addDoc(collection(db, 'users'), {
        username: newUsername.trim(),
        password: newPassword.trim(),
        isAdmin: newIsAdmin,
        position: newPosition.trim(),
        createdAt: Date.now(),
      });
      setShowModal(false);
      setNewUsername('');
      setNewPassword('');
      setNewIsAdmin(false);
      setNewPosition('');
      loadUsers();
    } catch (error) {
      console.error(error);
    }
  };

  const updateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser || !newUsername.trim() || !newPassword.trim()) return;
    
    try {
      await updateDoc(doc(db, 'users', editingUser.id), {
        username: newUsername.trim(),
        password: newPassword.trim(),
        isAdmin: newIsAdmin,
        position: newPosition.trim(),
      });
      setEditingUser(null);
      setNewUsername('');
      setNewPassword('');
      setNewIsAdmin(false);
      setNewPosition('');
      loadUsers();
    } catch (error) {
      console.error(error);
    }
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setNewUsername(user.username);
    setNewPassword(user.password);
    setNewIsAdmin(user.isAdmin);
    setNewPosition(user.position || '');
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setNewUsername('');
    setNewPassword('');
    setNewIsAdmin(false);
    setNewPosition('');
  };

  const deleteUser = async (userId: string) => {
    if (confirm('Удалить пользователя? Это действие необратимо.')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        loadUsers();
      } catch (error) {
        console.error(error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <div className="text-white text-xl animate-pulse">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 animate-fade-in">
          <h1 className="text-2xl font-bold text-white">👥 Пользователи</h1>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl transition text-sm font-medium hover-lift"
          >
            + Создать пользователя
          </button>
        </div>

        {/* Users List */}
        <div className="space-y-3">
          {users.map((user, index) => (
            <div key={user.id} className="glass rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover-lift animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-lg font-bold text-white">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{user.username}</span>
                    {user.isAdmin && (
                      <span className="px-2 py-0.5 bg-amber-600/30 text-amber-300 text-xs rounded-full">Администратор</span>
                    )}
                  </div>
                  {user.position && (
                    <div className="text-sm text-blue-400 mt-0.5">{user.position}</div>
                  )}
                  <div className="text-sm text-gray-400 mt-1">
                    Создан: {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-sm text-gray-400">
                    Изучено: <span className="text-white font-medium">{userStats[user.id]?.studied || 0}</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Выучено: <span className="text-green-400 font-medium">{userStats[user.id]?.learned || 0}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(user)}
                    className="px-3 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 rounded-xl transition text-sm hover-lift"
                  >
                    ✏️ Редактировать
                  </button>
                  <button
                    onClick={() => deleteUser(user.id)}
                    className="px-3 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 rounded-xl transition text-sm hover-lift"
                  >
                    🗑️ Удалить
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {users.length === 0 && (
          <div className="text-center py-20 animate-fade-in">
            <div className="text-6xl mb-4">👤</div>
            <p className="text-gray-400">Нет пользователей</p>
            <p className="text-gray-500 text-sm mt-1">Создайте первого пользователя</p>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass rounded-3xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-6">Создать пользователя</h2>
            <form onSubmit={createUser} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Имя пользователя</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                  className="w-full bg-gray-800/50 text-white rounded-xl px-3 py-2 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  placeholder="Введите имя"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Пароль</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full bg-gray-800/50 text-white rounded-xl px-3 py-2 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  placeholder="Введите пароль"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Должность</label>
                <input
                  type="text"
                  value={newPosition}
                  onChange={(e) => setNewPosition(e.target.value)}
                  className="w-full bg-gray-800/50 text-white rounded-xl px-3 py-2 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  placeholder="Например: Официант, Бармен, Повар"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isAdmin"
                  checked={newIsAdmin}
                  onChange={(e) => setNewIsAdmin(e.target.checked)}
                  className="w-4 h-4 rounded bg-gray-800 border-gray-700 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="isAdmin" className="text-sm text-gray-300">Администратор</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl transition font-medium">
                  Создать
                </button>
                <button type="button" onClick={() => { setShowModal(false); setNewUsername(''); setNewPassword(''); setNewIsAdmin(false); setNewPosition(''); }} className="flex-1 py-2 glass hover:bg-white/10 text-white rounded-xl transition">
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="glass rounded-3xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-6">Редактировать пользователя</h2>
            <form onSubmit={updateUser} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Имя пользователя</label>
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  required
                  className="w-full bg-gray-800/50 text-white rounded-xl px-3 py-2 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  placeholder="Введите имя"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Пароль</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full bg-gray-800/50 text-white rounded-xl px-3 py-2 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  placeholder="Введите пароль"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Должность</label>
                <input
                  type="text"
                  value={newPosition}
                  onChange={(e) => setNewPosition(e.target.value)}
                  className="w-full bg-gray-800/50 text-white rounded-xl px-3 py-2 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                  placeholder="Например: Официант, Бармен, Повар"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editIsAdmin"
                  checked={newIsAdmin}
                  onChange={(e) => setNewIsAdmin(e.target.checked)}
                  className="w-4 h-4 rounded bg-gray-800 border-gray-700 text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="editIsAdmin" className="text-sm text-gray-300">Администратор</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl transition font-medium">
                  Сохранить
                </button>
                <button type="button" onClick={closeEditModal} className="flex-1 py-2 glass hover:bg-white/10 text-white rounded-xl transition">
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage;
