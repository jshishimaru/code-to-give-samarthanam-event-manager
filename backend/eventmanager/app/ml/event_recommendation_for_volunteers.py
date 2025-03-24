import pandas as pd
import numpy as np
from langchain_community.embeddings import HuggingFaceEmbeddings
from sklearn.metrics.pairwise import cosine_similarity

def extract_skills_from_task(task, model_name="sentence-transformers/all-MiniLM-L6-v2"):
    """
    Extract relevant skill tags from the task description using an LLM.
    """
    embedding_model = HuggingFaceEmbeddings(model_name=model_name)
    skills = ["ai-ml", "data science", "development", "finance", "management", "marketing", "sales", "deep learning", "statistics"]  
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

def recommend_events_for_volunteer(volunteer_skills, events_data, model_name="sentence-transformers/all-MiniLM-L6-v2"):
    """
    Recommend events for a specific volunteer based on their skills.
    
    Args:
        volunteer_skills (str): Comma-separated list of volunteer skills
        events_data (list): List of event dictionaries with 'id', 'name', 'description', 'tasks' fields
        model_name (str): Name of the embedding model to use
        
    Returns:
        list: Events sorted by relevance to the volunteer
    """
    embedding_model = HuggingFaceEmbeddings(model_name=model_name)
    
    # Embed volunteer skills
    volunteer_embedding = embedding_model.embed_query(volunteer_skills)
    
    # Calculate similarity for each event
    event_similarities = []
    for event in events_data:
        # Create a context string combining event info and its tasks
        event_context = f"{event['name']}. {event['description']}"
        
        # Add task information if available
        if 'tasks' in event and event['tasks']:
            task_texts = []
            for task in event['tasks']:
                task_text = f"{task['name']}. {task['description']}"
                if 'required_skills' in task and task['required_skills']:
                    task_text += f" Skills: {task['required_skills']}"
                task_texts.append(task_text)
            
            event_context += " Tasks: " + " | ".join(task_texts)
        
        # Get event embedding
        event_embedding = embedding_model.embed_query(event_context)
        
        # Calculate similarity
        similarity = cosine_similarity([event_embedding], [volunteer_embedding])[0][0]
        
        # Store event with its similarity score
        event_with_score = event.copy()
        event_with_score['relevance_score'] = float(similarity)
        event_similarities.append(event_with_score)
    
    # Sort events by similarity score (descending)
    sorted_events = sorted(event_similarities, key=lambda x: x['relevance_score'], reverse=True)
    
    return sorted_events

def extract_event_skills(event_data, model_name="sentence-transformers/all-MiniLM-L6-v2"):
    """
    Extract relevant skills from an event based on its description and tasks.
    
    Args:
        event_data (dict): Event dictionary with 'name', 'description', 'tasks' fields
        model_name (str): Name of the embedding model to use
        
    Returns:
        list: List of extracted skills
    """
    # Create a context string combining event info and its tasks
    event_context = f"{event_data['name']}. {event_data['description']}"
    
    # Add task information if available
    if 'tasks' in event_data and event_data['tasks']:
        task_texts = []
        extracted_task_skills = []
        
        for task in event_data['tasks']:
            task_text = f"{task['name']}. {task['description']}"
            if 'required_skills' in task and task['required_skills']:
                task_text += f" Skills: {task['required_skills']}"
                # Directly extract skills from the required_skills field
                task_skills = [s.strip() for s in task['required_skills'].split(',') if s.strip()]
                extracted_task_skills.extend(task_skills)
            task_texts.append(task_text)
        
        event_context += " Tasks: " + " | ".join(task_texts)
        
        # If we already have explicit skills from tasks, return those
        if extracted_task_skills:
            # Remove duplicates while preserving order
            unique_skills = []
            for skill in extracted_task_skills:
                if skill not in unique_skills:
                    unique_skills.append(skill)
            return unique_skills
    
    # If no explicit skills found, extract them from the context
    return extract_skills_from_task(event_context, model_name)