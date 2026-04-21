'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface Task {
  id: string; 
  title: string; 
  is_completed: boolean; 
  created_at: string;
}

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 5;
  const router = useRouter();

  const [newTitle, setNewTitle] = useState('');

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth/login'); return; }

    let query = supabase.from('tasks').select('*', { count: 'exact' }).eq('user_id', user.id).order('created_at', { ascending: false });
    if (search) query = query.ilike('title', `%${search}%`);

    const { data, count } = await query.range((page - 1) * pageSize, page * pageSize - 1);
    if (data) { setTasks(data as Task[]); setTotalCount(count || 0); }
    setLoading(false);
  }, [search, page, router]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('tasks').insert([{ 
      title: newTitle, 
      user_id: user?.id,
      is_completed: false 
    }]);
    
    if (error) {
      alert('Lỗi khi lưu: ' + error.message);
    } else {
      setNewTitle(''); 
      fetchTasks();
    }
  };

  const toggleComplete = async (id: string, currentStatus: boolean) => {
    await supabase.from('tasks').update({ is_completed: !currentStatus }).eq('id', id);
    fetchTasks();
  };

  const deleteTask = async (id: string) => {
    if (confirm('Xóa nhé?')) { 
      await supabase.from('tasks').delete().eq('id', id); 
      fetchTasks(); 
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>My Tasks</h1>
        <button onClick={() => supabase.auth.signOut().then(() => router.push('/auth/login'))} className="btn-secondary">Thoát</button>
      </div>

      <section className="glass-card" style={{ marginBottom: '2rem' }}>
        <form onSubmit={addTask} style={{ display: 'flex', gap: '1rem' }}>
          <input 
            className="input-field" 
            style={{ flex: 1 }}
            placeholder="Bạn cần làm gì..." 
            value={newTitle} 
            onChange={(e) => setNewTitle(e.target.value)} 
            required 
          />
          <button type="submit" className="btn-primary">Thêm</button>
        </form>
      </section>

      <input className="input-field" style={{ width: '100%', marginBottom: '1.5rem' }} placeholder="Tìm kiếm công việc..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading ? <p style={{ textAlign: 'center' }}>Đang tải...</p> : tasks.map(task => (
          <div key={task.id} className="glass-card" style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <input type="checkbox" checked={task.is_completed} onChange={() => toggleComplete(task.id, task.is_completed)} />
            <div style={{ flex: 1, opacity: task.is_completed ? 0.5 : 1 }}>
              <h3 style={{ textDecoration: task.is_completed ? 'line-through' : 'none', fontSize: '1.1rem' }}>{task.title}</h3>
            </div>
            <button onClick={() => deleteTask(task.id)} style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
          </div>
        ))}
      </div>

      {totalCount > pageSize && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
          <button className="btn-secondary" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Trước</button>
          <span style={{ alignSelf: 'center' }}>Trang {page} / {Math.ceil(totalCount / pageSize)}</span>
          <button className="btn-secondary" disabled={page >= Math.ceil(totalCount / pageSize)} onClick={() => setPage(p => p + 1)}>Sau</button>
        </div>
      )}
    </div>
  );
}
