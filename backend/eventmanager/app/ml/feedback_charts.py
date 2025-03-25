import matplotlib.pyplot as plt
import pandas as pd
import numpy as np

def plot_event_charts():
    # Sample Feedback Data
    '''
    feedback_data = {
        "overall_experience": [8, 9, 7, 6, 9],
        "organization_quality": [7, 8, 8, 9, 6],
        "communication": [8, 7, 9, 8, 7],
        "host_interaction": [9, 6, 8, 9, 7],
        "volunteer_support": [7, 9, 8, 7, 8],
        "task_clarity": [8, 9, 7, 6, 8],
        "impact_awareness": [7, 8, 9, 8, 7],
        "inclusivity": [9, 8, 7, 9, 8],
        "time_management": [8, 7, 9, 8, 7],
        "recognition": [7, 9, 8, 7, 9],
        "would_volunteer_again": [1, 1, 0, 1, 1]
    }
    feedback_df = pd.DataFrame(feedback_data)

    # Sample Task Data
    task_data = {
        "task_name": ["Setup", "Registration", "Logistics", "Security", "Cleanup"],
        "volunteer_efficiency": [85, 78, 82, 88, 75],
        "volunteers": [10, 12, 8, 9, 6]
    }
    task_df = pd.DataFrame(task_data)
'''
    # 1. Histogram: Average Ratings for Feedback Metrics
    metrics = list(feedback_data.keys())[:-1]
    avg_ratings = feedback_df[metrics].mean()

    plt.figure(figsize=(10, 6))
    plt.bar(avg_ratings.index, avg_ratings.values, color='skyblue')
    plt.xlabel("Feedback Criteria")
    plt.ylabel("Average Rating (1-10)")
    plt.title("Average Volunteer Ratings for Event")
    plt.xticks(rotation=45)
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    plt.savefig("average_ratings.png", dpi=300, bbox_inches='tight')
    plt.show()

    # 2. Pie Chart: Volunteers Who Would Volunteer Again
    volunteer_again_counts = feedback_df["would_volunteer_again"].value_counts()
    labels = ["Yes", "No"]
    colors = ['lightgreen', 'lightcoral']

    plt.figure(figsize=(6, 6))
    plt.pie(volunteer_again_counts, labels=labels, autopct='%1.1f%%', colors=colors, startangle=140)
    plt.title("Volunteer Willingness to Participate Again")
    plt.savefig("volunteer_willingness.png", dpi=300, bbox_inches='tight')
    plt.show()

    # 3. Histogram: Average Volunteer Efficiency Per Task
    avg_efficiency = task_df.set_index("task_name")["volunteer_efficiency"]

    plt.figure(figsize=(10, 6))
    plt.bar(avg_efficiency.index, avg_efficiency.values, color='lightblue')
    plt.xlabel("Tasks")
    plt.ylabel("Average Efficiency")
    plt.title("Average Volunteer Efficiency per Task")
    plt.xticks(rotation=45)
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    plt.savefig("volunteer_efficiency.png", dpi=300, bbox_inches='tight')
    plt.show()

    # 4. Histogram: Number of Volunteers per Task
    volunteers_per_task = task_df.set_index("task_name")["volunteers"]

    plt.figure(figsize=(10, 6))
    plt.bar(volunteers_per_task.index, volunteers_per_task.values, color='orange')
    plt.xlabel("Tasks")
    plt.ylabel("Number of Volunteers")
    plt.title("Number of Volunteers Assigned to Each Task")
    plt.xticks(rotation=45)
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    plt.savefig("volunteers_per_task.png", dpi=300, bbox_inches='tight')
    plt.show()

# Execute the function with sample data
plot_event_charts()
