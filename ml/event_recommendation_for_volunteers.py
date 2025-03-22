import pandas as pd
import numpy as np
from langchain.embeddings import HuggingFaceEmbeddings
from sklearn.metrics.pairwise import cosine_similarity

def extract_skills_from_task(task, model_name="sentence-transformers/all-MiniLM-L6-v2"):
    """
    Extract relevant skill tags from the task description using an LLM.
    """
    embedding_model = HuggingFaceEmbeddings(model_name=model_name)
    skills = ["ai-ml", "data science", "development", "finance", "management", "marketing", "sales", "deep learning", "statistics"]  # Predefined skill set
    skill_embeddings = embedding_model.embed_documents(skills)
    task_embedding = embedding_model.embed_query(task)
    
    similarities = cosine_similarity([task_embedding], skill_embeddings)[0]
    relevant_skills = [skills[i] for i in np.argsort(similarities)[-3:][::-1]]  # Top 3 relevant skills
    
    return relevant_skills

def match_tasks_to_volunteers(tasks, volunteers_df, model_name="sentence-transformers/all-MiniLM-L6-v2"):
    """
    Match each volunteer to all tasks but rank them in order of relevance based on their skills.
    """
    embedding_model = HuggingFaceEmbeddings(model_name=model_name)
    volunteer_task_map = {volunteer: [] for volunteer in volunteers_df['Name']}
    
    for index, row in volunteers_df.iterrows():
        volunteer_name = row['Name']
        volunteer_skills = row['Skills']
        volunteer_embedding = embedding_model.embed_query(volunteer_skills)
        
        task_similarities = []
        for task in tasks:
            skill_tags = extract_skills_from_task(task, model_name)
            task_embedding = embedding_model.embed_query(task + ' ' + ' '.join(skill_tags))
            similarity = cosine_similarity([task_embedding], [volunteer_embedding])[0][0]
            task_similarities.append((task, similarity))
        
        # Sort tasks based on similarity score (descending order)
        task_similarities.sort(key=lambda x: x[1], reverse=True)
        recommended_tasks = [task for task, sim in task_similarities]
        volunteer_task_map[volunteer_name] = recommended_tasks
    
    return volunteer_task_map

# Example usage
'''data = {
    'Name': ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank', 'Grace', 'Hannah'],
    'Skills': ['ai-ml data science development',
               'finance management',
               'data science statistics',
               'marketing sales',
               'ai-ml deep learning research',
               'statistics research',
               'sales marketing communication',
               'financial analysis risk management']
}
volunteers_df = pd.DataFrame(data)

tasks = ["keeping a count of sales", "creating AI models", "data analysis for research", "financial planning"]

volunteer_task_map = match_tasks_to_volunteers(tasks, volunteers_df)

print("\nTask Recommendations for Volunteers:")
for volunteer, assigned_tasks in volunteer_task_map.items():
    print(f"{volunteer} can see tasks in order of relevance: {assigned_tasks}")
'''