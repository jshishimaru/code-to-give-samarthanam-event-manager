import pandas as pd
import numpy as np
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import FAISS
from sklearn.metrics.pairwise import cosine_similarity
from transformers import pipeline

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

def recommend_volunteers(task, num_required, volunteers_df, model_name="sentence-transformers/all-MiniLM-L6-v2", similarity_threshold=0.6):
    """
    Recommend volunteers based on task description by automatically extracting required skills.
    """
    # Extract relevant skills
    skill_tags = extract_skills_from_task(task, model_name)
    
    # Initialize embedding model
    embedding_model = HuggingFaceEmbeddings(model_name=model_name)
    
    # Compute embeddings for volunteer skills
    skill_texts = volunteers_df['Skills'].tolist()
    skill_embeddings = embedding_model.embed_documents(skill_texts)
    
    # Compute query embedding
    query = task + ' ' + ' '.join(skill_tags)
    query_embedding = embedding_model.embed_query(query)
    
    # Compute cosine similarities
    similarities = cosine_similarity([query_embedding], skill_embeddings)[0]
    
    # Get top relevant volunteers
    volunteer_scores = list(zip(volunteers_df['Name'], similarities))
    sorted_volunteers = sorted(volunteer_scores, key=lambda x: x[1], reverse=True)
    
    # Filter volunteers based on similarity threshold
    recommended_volunteers = [name for name, score in sorted_volunteers if score >= similarity_threshold]
    
    # Ensure at least 2 * num_required volunteers are recommended
    if len(recommended_volunteers) < num_required * 2:
        recommended_volunteers = [name for name, _ in sorted_volunteers[:num_required * 2]]
    
    return recommended_volunteers

# Example usage
'''data = {
    'Name': ['Alice', 'Bob', 'Charlie', 'David', 'Eve'],
    'Skills': ['ai-ml data science development',
               'finance management',
               'data science statistics',
               'marketing sales',
               'ai-ml deep learning research']
}
volunteers_df = pd.DataFrame(data)

task = "keeping a count of sales"
num_required = 2

recommended = recommend_volunteers(task, num_required, volunteers_df)
print("Recommended Volunteers:", recommended)
'''