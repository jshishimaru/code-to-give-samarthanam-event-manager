import pandas as pd
import numpy as np
from langchain_community.embeddings import HuggingFaceEmbeddings
from sklearn.metrics.pairwise import cosine_similarity
import time
import functools
import re

# Global cache for embeddings to avoid recalculating
_EMBEDDING_CACHE = {}
_SKILL_EMBEDDINGS_CACHE = {}
_MODEL_INSTANCE = None

# Common skills list for direct matching
COMMON_SKILLS = [
    "programming", "python", "java", "javascript", "web development", 
    "design", "graphic design", "ui/ux", "communication", "project management",
    "leadership", "team management", "data analysis", "ai-ml", "data science", 
    "development", "finance", "management", "marketing", "sales", "deep learning", 
    "statistics", "event planning", "coordination", "social media", "content creation",
    "teaching", "mentoring", "fundraising", "public speaking", "writing"
]

def get_embedding_model(model_name="sentence-transformers/all-MiniLM-L6-v2"):
    """Get a cached instance of the embedding model to avoid reloading."""
    global _MODEL_INSTANCE
    if _MODEL_INSTANCE is None:
        _MODEL_INSTANCE = HuggingFaceEmbeddings(model_name=model_name)
    return _MODEL_INSTANCE

@functools.lru_cache(maxsize=128)
def embed_text(text, model_name="sentence-transformers/all-MiniLM-L6-v2"):
    """Embed text with caching."""
    model = get_embedding_model(model_name)
    return model.embed_query(text)

def get_cached_skill_embeddings(model_name="sentence-transformers/all-MiniLM-L6-v2"):
    """Get cached skill embeddings."""
    global _SKILL_EMBEDDINGS_CACHE
    if model_name not in _SKILL_EMBEDDINGS_CACHE:
        model = get_embedding_model(model_name)
        _SKILL_EMBEDDINGS_CACHE[model_name] = model.embed_documents(COMMON_SKILLS)
    return _SKILL_EMBEDDINGS_CACHE[model_name]

def direct_skill_matching(text, threshold=0.6):
    """
    Fast direct skill matching without embeddings.
    Uses regex pattern matching to find skills in text.
    """
    found_skills = []
    text = text.lower()
    
    # Create a single regex pattern for all skills
    pattern = r'\b(' + '|'.join(re.escape(skill.lower()) for skill in COMMON_SKILLS) + r')\b'
    matches = re.finditer(pattern, text)
    
    # Count occurrences
    skill_counts = {}
    for match in matches:
        skill = match.group(0)
        skill_counts[skill] = skill_counts.get(skill, 0) + 1
    
    # Sort by frequency and return top skills
    sorted_skills = sorted(skill_counts.items(), key=lambda x: x[1], reverse=True)
    return [skill for skill, count in sorted_skills[:3]]

def extract_skills_from_task(task, model_name="sentence-transformers/all-MiniLM-L6-v2", use_ml=True):
    """
    Extract relevant skill tags from the task description.
    Now with both ML-based and direct matching approaches.
    """
    # Try direct matching first (fast)
    direct_skills = direct_skill_matching(task)
    if direct_skills and (not use_ml or len(direct_skills) >= 3):
        return direct_skills[:3]  # Return top 3 directly matched skills
    
    # Fall back to embedding-based matching if needed and ML is enabled
    if use_ml:
        try:
            # Get cached embeddings
            skill_embeddings = get_cached_skill_embeddings(model_name)
            task_embedding = embed_text(task, model_name)
            
            # Calculate similarities
            similarities = cosine_similarity([task_embedding], skill_embeddings)[0]
            relevant_skills = [COMMON_SKILLS[i] for i in np.argsort(similarities)[-3:][::-1]]
            
            # Combine with direct skills for best results
            combined_skills = []
            for skill in direct_skills + relevant_skills:
                if skill not in combined_skills:
                    combined_skills.append(skill)
            
            return combined_skills[:3]  # Return top 3 combined skills
        except Exception as e:
            print(f"ML skill extraction failed: {str(e)}, using direct matching")
            return direct_skills
    
    return direct_skills

def match_tasks_to_volunteers(tasks, volunteers_df, model_name="sentence-transformers/all-MiniLM-L6-v2", use_ml=True):
    """
    Match each volunteer to all tasks ranked by relevance.
    Has both ML-based and direct matching approaches.
    """
    volunteer_task_map = {volunteer: [] for volunteer in volunteers_df['Name']}
    
    start_time = time.time()
    
    for index, row in volunteers_df.iterrows():
        volunteer_name = row['Name']
        volunteer_skills = row['Skills']
        
        # Fast path: direct skill matching
        if not use_ml:
            volunteer_skills_list = [s.strip().lower() for s in volunteer_skills.split(',') if s.strip()]
            
            # Calculate matches based on skill overlap
            task_matches = []
            for task in tasks:
                task_skills = direct_skill_matching(task)
                
                # Count matching skills
                matching_skills = sum(1 for skill in task_skills if any(vs in skill or skill in vs for vs in volunteer_skills_list))
                match_score = matching_skills / max(len(task_skills), 1)
                
                task_matches.append((task, match_score))
            
            # Sort by match score
            task_matches.sort(key=lambda x: x[1], reverse=True)
            volunteer_task_map[volunteer_name] = [task for task, _ in task_matches]
            continue
        
        # ML path
        try:
            # Get volunteer embedding
            volunteer_embedding = embed_text(volunteer_skills, model_name)
            
            task_similarities = []
            for task in tasks:
                # Get task embedding with skills context
                skill_tags = extract_skills_from_task(task, model_name, use_ml=True)
                task_with_skills = task + ' ' + ' '.join(skill_tags)
                task_embedding = embed_text(task_with_skills, model_name)
                
                # Calculate similarity
                similarity = cosine_similarity([task_embedding], [volunteer_embedding])[0][0]
                task_similarities.append((task, similarity))
            
            # Sort tasks by similarity
            task_similarities.sort(key=lambda x: x[1], reverse=True)
            volunteer_task_map[volunteer_name] = [task for task, _ in task_similarities]
        except Exception as e:
            print(f"ML task matching failed for {volunteer_name}: {str(e)}, using fallback")
            # Fallback to direct matching
            volunteer_skills_list = [s.strip().lower() for s in volunteer_skills.split(',') if s.strip()]
            
            # Calculate matches based on skill overlap
            task_matches = []
            for task in tasks:
                task_skills = direct_skill_matching(task)
                
                # Count matching skills
                matching_skills = sum(1 for skill in task_skills if any(vs in skill or skill in vs for vs in volunteer_skills_list))
                match_score = matching_skills / max(len(task_skills), 1)
                
                task_matches.append((task, match_score))
            
            # Sort by match score
            task_matches.sort(key=lambda x: x[1], reverse=True)
            volunteer_task_map[volunteer_name] = [task for task, _ in task_matches]
    
    print(f"Task matching completed in {time.time() - start_time:.2f} seconds")
    return volunteer_task_map

def recommend_events_for_volunteer(volunteer_skills, events_data, model_name="sentence-transformers/all-MiniLM-L6-v2", use_ml=True):
    """
    Recommend events for a specific volunteer based on their skills.
    Now with both ML-based and direct matching approaches.
    
    Args:
        volunteer_skills (str): Comma-separated list of volunteer skills
        events_data (list): List of event dictionaries with 'id', 'name', 'description', 'tasks' fields
        model_name (str): Name of the embedding model to use
        use_ml (bool): Whether to use ML-based matching or the faster direct matching
        
    Returns:
        list: Events sorted by relevance to the volunteer
    """
    start_time = time.time()
    
    # Fast path: direct skill matching
    if not use_ml:
        volunteer_skills_list = [s.strip().lower() for s in volunteer_skills.split(',') if s.strip()]
        
        event_matches = []
        for event in events_data:
            # Extract event context
            event_context = f"{event['name']}. {event['description']}"
            if 'tasks' in event and event['tasks']:
                for task in event['tasks']:
                    task_text = f"{task['name']}. {task['description']}"
                    if 'required_skills' in task and task['required_skills']:
                        task_text += f" Skills: {task['required_skills']}"
                    event_context += " " + task_text
            
            # Extract skills from event
            event_skills = direct_skill_matching(event_context)
            
            # Count matching skills
            matching_skills = sum(1 for skill in event_skills if any(vs in skill or skill in vs for vs in volunteer_skills_list))
            if volunteer_skills_list:
                match_score = matching_skills / len(volunteer_skills_list) if volunteer_skills_list else 0
            else:
                match_score = 0
            
            # Create event with score
            event_with_score = event.copy()
            event_with_score['relevance_score'] = float(match_score)
            event_matches.append(event_with_score)
        
        # Sort events by match score
        sorted_events = sorted(event_matches, key=lambda x: x['relevance_score'], reverse=True)
        print(f"Direct event matching completed in {time.time() - start_time:.2f} seconds")
        return sorted_events
    
    # ML path
    try:
        # Get volunteer embedding
        volunteer_embedding = embed_text(volunteer_skills, model_name)
        
        event_similarities = []
        for event in events_data:
            # Create event context
            event_context = f"{event['name']}. {event['description']}"
            
            # Add task information
            if 'tasks' in event and event['tasks']:
                task_texts = []
                for task in event['tasks']:
                    task_text = f"{task['name']}. {task['description']}"
                    if 'required_skills' in task and task['required_skills']:
                        task_text += f" Skills: {task['required_skills']}"
                    task_texts.append(task_text)
                
                event_context += " Tasks: " + " | ".join(task_texts)
            
            # Get event embedding
            event_embedding = embed_text(event_context, model_name)
            
            # Calculate similarity
            similarity = cosine_similarity([event_embedding], [volunteer_embedding])[0][0]
            
            # Store event with score
            event_with_score = event.copy()
            event_with_score['relevance_score'] = float(similarity)
            event_similarities.append(event_with_score)
        
        # Sort events by similarity
        sorted_events = sorted(event_similarities, key=lambda x: x['relevance_score'], reverse=True)
        print(f"ML event matching completed in {time.time() - start_time:.2f} seconds")
        return sorted_events
        
    except Exception as e:
        print(f"ML event recommendation failed: {str(e)}, using fallback")
        # Fall back to direct matching
        return recommend_events_for_volunteer(volunteer_skills, events_data, model_name, use_ml=False)

def extract_event_skills(event_data, model_name="sentence-transformers/all-MiniLM-L6-v2", use_ml=True):
    """
    Extract relevant skills from an event based on its description and tasks.
    Now with both ML-based and direct matching approaches.
    
    Args:
        event_data (dict): Event dictionary with 'name', 'description', 'tasks' fields
        model_name (str): Name of the embedding model to use
        use_ml (bool): Whether to use ML-based extraction or the faster direct extraction
        
    Returns:
        list: List of extracted skills
    """
    # First check for explicitly defined skills in tasks
    if 'tasks' in event_data and event_data['tasks']:
        extracted_task_skills = []
        
        for task in event_data['tasks']:
            if 'required_skills' in task and task['required_skills']:
                # Directly extract skills from the required_skills field
                task_skills = [s.strip() for s in task['required_skills'].split(',') if s.strip()]
                extracted_task_skills.extend(task_skills)
        
        # If we already have explicit skills from tasks, return those
        if extracted_task_skills:
            # Remove duplicates while preserving order
            unique_skills = []
            for skill in extracted_task_skills:
                if skill not in unique_skills:
                    unique_skills.append(skill)
            return unique_skills
    
    # Create a context string combining event info and its tasks
    event_context = f"{event_data['name']}. {event_data['description']}"
    
    # Add task information
    if 'tasks' in event_data and event_data['tasks']:
        task_texts = []
        for task in event_data['tasks']:
            task_text = f"{task['name']}. {task['description']}"
            task_texts.append(task_text)
        event_context += " Tasks: " + " | ".join(task_texts)
    
    # Extract skills from the context
    return extract_skills_from_task(event_context, model_name, use_ml=use_ml)