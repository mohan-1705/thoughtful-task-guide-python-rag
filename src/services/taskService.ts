import { api } from './api';

export interface Task {
  id?: string;
  title: string;
  description: string;
  status: 'pending' | 'completed';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
}

export const taskService = {
  getTasks: async (): Promise<Task[]> => {
    const res = await api.get('/tasks');
    return res.data;
  },
  createTask: async (task: Task) => {
    const res = await api.post('/tasks', task);
    return res.data;
  },
  updateTask: async (id: string, task: Task) => {
    const res = await api.put(`/tasks/${id}`, task);
    return res.data;
  },
  deleteTask: async (id: string) => {
    const res = await api.delete(`/tasks/${id}`);
    return res.data;
  },
};
