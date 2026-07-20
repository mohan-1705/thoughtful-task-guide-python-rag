import faiss
import numpy as np

class TaskVectorStore:
    def __init__(self, dimension=768):
        self.dimension = dimension
        self.index = faiss.IndexFlatL2(dimension)
        self.task_ids = []

    def add_or_update_task(self, task_id: str, embedding: list):
        if task_id in self.task_ids:
            self.remove_task(task_id)
        
        vec = np.array([embedding], dtype='float32')
        self.index.add(vec)
        self.task_ids.append(task_id)

    def remove_task(self, task_id: str):
        if task_id in self.task_ids:
            idx = self.task_ids.index(task_id)
            self.task_ids.pop(idx)
            # Rebuild index without the removed vector
            vectors = []
            for i in range(self.index.ntotal):
                if i != idx:
                    vectors.append(self.index.reconstruct(i))
            self.index.reset()
            if vectors:
                self.index.add(np.array(vectors, dtype='float32'))

    def search(self, query_embedding: list, top_k=5):
        if self.index.ntotal == 0:
            return []
        
        vec = np.array([query_embedding], dtype='float32')
        k = min(top_k, self.index.ntotal)
        distances, indices = self.index.search(vec, k)
        
        results = []
        for idx in indices[0]:
            if idx != -1 and idx < len(self.task_ids):
                results.append(self.task_ids[idx])
        return results

vector_store = TaskVectorStore()
