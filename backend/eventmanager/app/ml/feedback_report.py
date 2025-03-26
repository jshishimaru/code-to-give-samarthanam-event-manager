import json
import matplotlib.pyplot as plt
from textblob import TextBlob

def analyze_sentiment(feedback_list):
    all_feedback_text = " ".join([f["strengths"] + " " + f["improvements"] + " " + f["additional_comments"] for f in feedback_list])
    sentiment_score = TextBlob(all_feedback_text).sentiment.polarity
    if sentiment_score > 0.2:
        return "Positive"
    elif sentiment_score < -0.2:
        return "Negative"
    else:
        return "Neutral"

def calculate_average_ratings(feedback_list):
    rating_fields = ["overall_experience", "organization_quality", "communication", "host_interaction",
                     "volunteer_support", "task_clarity", "impact_awareness", "inclusivity",
                     "time_management", "recognition"]
    return {field: round(sum(f[field] for f in feedback_list) / len(feedback_list), 2) for field in rating_fields}

def analyze_tasks(task_list, subtask_list):
    completed_tasks = sum(1 for task in task_list if task["status"] == "Completed")
    completed_subtasks = sum(1 for subtask in subtask_list if subtask["status"] == "Completed")
    return completed_tasks, len(task_list), completed_subtasks, len(subtask_list)

def generate_swot_analysis(feedback_list, task_analysis):
    strengths = list(set(f["strengths"] for f in feedback_list))
    weaknesses = list(set(f["improvements"] for f in feedback_list))
    opportunities = ["Future collaborations", "Increase outreach", "Enhance volunteer training"]
    threats = ["Lack of tools", "Coordination issues", task_analysis]
    return strengths, weaknesses, opportunities, threats

def generate_event_report(event, feedback_list, task_list, subtask_list):
    avg_ratings = calculate_average_ratings(feedback_list)
    completed_tasks, total_tasks, completed_subtasks, total_subtasks = analyze_tasks(task_list, subtask_list)
    sentiment = analyze_sentiment(feedback_list)
    strengths, weaknesses, opportunities, threats = generate_swot_analysis(feedback_list, event["task_analysis"])
    
    report = {
        "event_details": {
            "event_name": event["event_name"],
            "date_time": f"{event['start_time']} - {event['end_time']}",
            "venue": event["location"],
            "host": event["host"],
            "volunteers": {
                "enrolled": event["volunteer_enrolled"],
                "required": event["required_volunteers"]
            },
            "overview": event["overview"]
        },
        "feedback_summary": {
            "strengths": strengths,
            "improvements": weaknesses,
            "additional_comments": [f["additional_comments"] for f in feedback_list],
            "sentiment_analysis": sentiment
        },
        "task_performance": {
            "tasks_completed": completed_tasks,
            "total_tasks": total_tasks,
            "subtasks_completed": completed_subtasks,
            "total_subtasks": total_subtasks,
            "task_challenges": event["task_analysis"],
            "task_notifications": [task["notification_message"] for task in task_list]
        },
        "ratings": avg_ratings,
        "volunteer_willingness": sum(1 for f in feedback_list if f["would_volunteer_again"]),
        "swot_analysis": {
            "strengths": strengths,
            "weaknesses": weaknesses,
            "opportunities": opportunities,
            "threats": threats
        }
    }
    
    return json.dumps(report, indent=4)

