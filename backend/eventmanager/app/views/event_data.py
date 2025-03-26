import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import io
import base64
from django.http import HttpResponse, JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from ..models import Feedback, EventInfo, TaskInfo, User
import json
import traceback
from matplotlib.backends.backend_svg import FigureCanvasSVG
from django.db.models import Avg, Count, Q, F

@method_decorator(csrf_exempt, name='dispatch')
class EventFeedbackChartsView(View):
    """Generate SVG charts from event feedback data"""
    
    def get(self, request):
        try:
            # Check if user is authenticated and is a host
            if not request.user.is_authenticated:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Authentication required'
                }, status=401)
            
            if not request.user.isHost:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Only hosts can view event analytics'
                }, status=403)
            
            # Get event_id from query parameters
            event_id = request.GET.get('event_id')
            if not event_id:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Event ID is required'
                }, status=400)
            
            # Get the event
            try:
                event = EventInfo.objects.get(id=event_id)
            except EventInfo.DoesNotExist:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Event not found'
                }, status=404)
            
            # Verify user is the host of this event
            if event.host_id != request.user.id:
                return JsonResponse({
                    'status': 'error',
                    'message': 'You can only view analytics for events you are hosting'
                }, status=403)
            
            # Get chart type from query parameters
            chart_type = request.GET.get('chart_type', 'all')
            
            # Get feedback data for this event
            feedbacks = Feedback.objects.filter(event=event)
            
            if not feedbacks.exists():
                return JsonResponse({
                    'status': 'error',
                    'message': 'No feedback data available for this event'
                }, status=404)
                
            # Convert to DataFrame for easier analysis
            feedback_data = {
                'overall_experience': [],
                'organization_quality': [],
                'communication': [],
                'host_interaction': [],
                'volunteer_support': [],
                'task_clarity': [],
                'impact_awareness': [],
                'inclusivity': [],
                'time_management': [],
                'recognition': [],
                'would_volunteer_again': []
            }
            
            for feedback in feedbacks:
                feedback_data['overall_experience'].append(feedback.overall_experience or 0)
                feedback_data['organization_quality'].append(feedback.organization_quality or 0)
                feedback_data['communication'].append(feedback.communication or 0)
                feedback_data['host_interaction'].append(feedback.host_interaction or 0)
                feedback_data['volunteer_support'].append(feedback.volunteer_support or 0)
                feedback_data['task_clarity'].append(feedback.task_clarity or 0)
                feedback_data['impact_awareness'].append(feedback.impact_awareness or 0)
                feedback_data['inclusivity'].append(feedback.inclusivity or 0)
                feedback_data['time_management'].append(feedback.time_management or 0)
                feedback_data['recognition'].append(feedback.recognition or 0)
                feedback_data['would_volunteer_again'].append(1 if feedback.would_volunteer_again else 0)
            
            feedback_df = pd.DataFrame(feedback_data)
            
            # Get task data for this event
            tasks = TaskInfo.objects.filter(event=event)
            task_data = {
                'task_name': [],
                'volunteer_efficiency': [],
                'volunteers': [],
                'status': []
            }
            
            for task in tasks:
                task_data['task_name'].append(task.task_name)
                task_data['volunteer_efficiency'].append(task.volunteer_efficiency or 0)
                task_data['volunteers'].append(task.volunteers.count())
                task_data['status'].append(task.status)
            
            task_df = pd.DataFrame(task_data)
            
            # Dictionary to store chart SVGs
            chart_svgs = {}
            
            # Generate the requested charts
            if chart_type in ['all', 'ratings']:
                # 1. Bar Chart: Average Ratings for Feedback Metrics
                metrics = list(feedback_data.keys())[:-1]  # Exclude would_volunteer_again
                avg_ratings = feedback_df[metrics].mean()
                
                plt.figure(figsize=(10, 6))
                plt.bar(avg_ratings.index, avg_ratings.values, color='skyblue')
                plt.xlabel("Feedback Criteria")
                plt.ylabel("Average Rating (0-10)")
                plt.title(f"Average Volunteer Ratings for {event.event_name}")
                plt.xticks(rotation=45)
                plt.grid(axis='y', linestyle='--', alpha=0.7)
                plt.tight_layout()
                
                # Convert to SVG
                svg_io = io.BytesIO()
                plt.savefig(svg_io, format='svg')
                plt.close()
                
                chart_svgs['average_ratings'] = svg_io.getvalue().decode('utf-8')
            
            if chart_type in ['all', 'volunteer_again']:
                # 2. Pie Chart: Volunteers Who Would Volunteer Again
                volunteer_again_counts = feedback_df["would_volunteer_again"].value_counts()
                would_volunteer = volunteer_again_counts.get(1, 0)
                would_not_volunteer = volunteer_again_counts.get(0, 0)
                
                labels = ["Yes", "No"]
                sizes = [would_volunteer, would_not_volunteer]
                colors = ['lightgreen', 'lightcoral']
                
                plt.figure(figsize=(6, 6))
                plt.pie(sizes, labels=labels, autopct='%1.1f%%', colors=colors, startangle=140)
                plt.title(f"Volunteer Willingness to Participate Again in {event.event_name}")
                plt.tight_layout()
                
                # Convert to SVG
                svg_io = io.BytesIO()
                plt.savefig(svg_io, format='svg')
                plt.close()
                
                chart_svgs['volunteer_willingness'] = svg_io.getvalue().decode('utf-8')
            
            if chart_type in ['all', 'efficiency'] and not task_df.empty:
                # 3. Bar Chart: Average Volunteer Efficiency Per Task
                plt.figure(figsize=(10, 6))
                plt.bar(task_df['task_name'], task_df['volunteer_efficiency'], color='lightblue')
                plt.xlabel("Tasks")
                plt.ylabel("Efficiency Rating")
                plt.title(f"Volunteer Efficiency by Task for {event.event_name}")
                plt.xticks(rotation=45)
                plt.grid(axis='y', linestyle='--', alpha=0.7)
                plt.tight_layout()
                
                # Convert to SVG
                svg_io = io.BytesIO()
                plt.savefig(svg_io, format='svg')
                plt.close()
                
                chart_svgs['volunteer_efficiency'] = svg_io.getvalue().decode('utf-8')
            
            if chart_type in ['all', 'task_distribution'] and not task_df.empty:
                # 4. Bar Chart: Number of Volunteers per Task
                plt.figure(figsize=(10, 6))
                plt.bar(task_df['task_name'], task_df['volunteers'], color='orange')
                plt.xlabel("Tasks")
                plt.ylabel("Number of Volunteers")
                plt.title(f"Volunteer Distribution Across Tasks for {event.event_name}")
                plt.xticks(rotation=45)
                plt.grid(axis='y', linestyle='--', alpha=0.7)
                plt.tight_layout()
                
                # Convert to SVG
                svg_io = io.BytesIO()
                plt.savefig(svg_io, format='svg')
                plt.close()
                
                chart_svgs['volunteers_per_task'] = svg_io.getvalue().decode('utf-8')
                
            if chart_type in ['all', 'task_status'] and not task_df.empty:
                # 5. Pie Chart: Task Status Distribution
                status_counts = task_df['status'].value_counts()
                
                plt.figure(figsize=(6, 6))
                plt.pie(status_counts, labels=status_counts.index, autopct='%1.1f%%', startangle=140)
                plt.title(f"Task Status Distribution for {event.event_name}")
                plt.tight_layout()
                
                # Convert to SVG
                svg_io = io.BytesIO()
                plt.savefig(svg_io, format='svg')
                plt.close()
                
                chart_svgs['task_status'] = svg_io.getvalue().decode('utf-8')
                
            if chart_type in ['all', 'radar']:
                # 6. Radar Chart: Average Ratings across all dimensions
                metrics = list(feedback_data.keys())[:-1]  # Exclude would_volunteer_again
                avg_ratings = feedback_df[metrics].mean()
                
                # Create radar chart
                angles = np.linspace(0, 2*np.pi, len(metrics), endpoint=False).tolist()
                # Close the plot
                avg_values = avg_ratings.values.tolist()
                avg_values.append(avg_values[0])
                angles.append(angles[0])
                metrics = metrics + [metrics[0]]
                
                fig, ax = plt.subplots(figsize=(8, 8), subplot_kw=dict(polar=True))
                ax.plot(angles, avg_values, color='blue', linewidth=2)
                ax.fill(angles, avg_values, color='blue', alpha=0.25)
                ax.set_thetagrids(np.degrees(angles[:-1]), metrics[:-1])
                ax.set_ylim(0, 10)
                ax.grid(True)
                plt.title(f"Feedback Radar Chart for {event.event_name}")
                plt.tight_layout()
                
                # Convert to SVG
                svg_io = io.BytesIO()
                plt.savefig(svg_io, format='svg')
                plt.close()
                
                chart_svgs['radar_chart'] = svg_io.getvalue().decode('utf-8')
            
            # Return the SVGs as JSON
            return JsonResponse({
                'status': 'success',
                'event_name': event.event_name,
                'feedback_count': feedbacks.count(),
                'charts': chart_svgs
            })
            
        except Exception as e:
            print(f"Error in EventFeedbackChartsView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)

@method_decorator(csrf_exempt, name='dispatch')
class SingleChartView(View):
    """Generate a single SVG chart and return it directly as SVG response"""
    
    def get(self, request):
        try:
            # Check if user is authenticated
            if not request.user.is_authenticated:
                return HttpResponse('Authentication required', status=401)
            
            # Get event_id and chart_type from query parameters
            event_id = request.GET.get('event_id')
            chart_type = request.GET.get('chart_type')
            
            if not event_id or not chart_type:
                return HttpResponse('Event ID and chart type are required', status=400)
            
            # Get the event
            try:
                event = EventInfo.objects.get(id=event_id)
            except EventInfo.DoesNotExist:
                return HttpResponse('Event not found', status=404)
            
            # Verify access permissions
            if not request.user.isHost and event.host_id != request.user.id:
                return HttpResponse('Access denied', status=403)
            
            # Get feedback data for this event
            feedbacks = Feedback.objects.filter(event=event)
            
            if not feedbacks.exists() and chart_type != 'task_status':
                return HttpResponse('No feedback data available for this event', status=404)
                
            # Set up the figure for SVG output
            fig = plt.figure(figsize=(10, 6))
            
            # Generate the requested chart
            if chart_type == 'average_ratings':
                # Extract feedback data
                metrics = ['overall_experience', 'organization_quality', 'communication', 
                           'host_interaction', 'volunteer_support', 'task_clarity',
                           'impact_awareness', 'inclusivity', 'time_management', 'recognition']
                
                avg_values = []
                for metric in metrics:
                    avg = feedbacks.aggregate(avg=Avg(metric))['avg'] or 0
                    avg_values.append(avg)
                
                plt.bar(metrics, avg_values, color='skyblue')
                plt.xlabel("Feedback Criteria")
                plt.ylabel("Average Rating (0-10)")
                plt.title(f"Average Volunteer Ratings for {event.event_name}")
                plt.xticks(rotation=45)
                plt.grid(axis='y', linestyle='--', alpha=0.7)
                plt.tight_layout()
                
            elif chart_type == 'volunteer_willingness':
                # Count yes/no responses
                would_volunteer = feedbacks.filter(would_volunteer_again=True).count()
                would_not_volunteer = feedbacks.filter(would_volunteer_again=False).count()
                
                labels = ["Yes", "No"]
                sizes = [would_volunteer, would_not_volunteer]
                colors = ['lightgreen', 'lightcoral']
                
                plt.pie(sizes, labels=labels, autopct='%1.1f%%', colors=colors, startangle=140)
                plt.title(f"Volunteer Willingness to Participate Again in {event.event_name}")
                
            elif chart_type == 'task_status':
                # Get tasks for this event
                tasks = TaskInfo.objects.filter(event=event)
                
                if not tasks.exists():
                    return HttpResponse('No tasks available for this event', status=404)
                
                # Count tasks by status
                status_counts = tasks.values('status').annotate(count=Count('status'))
                statuses = [item['status'] for item in status_counts]
                counts = [item['count'] for item in status_counts]
                
                plt.pie(counts, labels=statuses, autopct='%1.1f%%', startangle=140)
                plt.title(f"Task Status Distribution for {event.event_name}")
                
            else:
                return HttpResponse('Invalid chart type', status=400)
            
            # Convert to SVG and return directly
            canvas = FigureCanvasSVG(fig)
            response = HttpResponse(content_type='image/svg+xml')
            canvas.print_svg(response)
            plt.close(fig)
            
            return response
            
        except Exception as e:
            print(f"Error in SingleChartView: {str(e)}")
            print(traceback.format_exc())
            return HttpResponse(str(e), status=500)

@method_decorator(csrf_exempt, name='dispatch')
class HostAnalyticsView(View):
    """Generate analytics SVG charts for all events hosted by the user"""
    
    def get(self, request):
        try:
            # Check authentication
            if not request.user.is_authenticated or not request.user.isHost:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Authentication as host required'
                }, status=403)
            
            # Get all events hosted by this user
            host_events = EventInfo.objects.filter(host=request.user)
            
            if not host_events.exists():
                return JsonResponse({
                    'status': 'error',
                    'message': 'No events found'
                }, status=404)
            
            # Chart type
            chart_type = request.GET.get('chart_type', 'all')
            
            # Dictionary to store charts
            chart_svgs = {}
            
            # 1. Events by Status
            if chart_type in ['all', 'events_by_status']:
                status_counts = host_events.values('status').annotate(count=Count('status'))
                statuses = [item['status'] for item in status_counts]
                counts = [item['count'] for item in status_counts]
                
                plt.figure(figsize=(8, 8))
                plt.pie(counts, labels=statuses, autopct='%1.1f%%', startangle=140)
                plt.title(f"Events by Status for {request.user.name}")
                
                # Convert to SVG
                svg_io = io.BytesIO()
                plt.savefig(svg_io, format='svg')
                plt.close()
                
                chart_svgs['events_by_status'] = svg_io.getvalue().decode('utf-8')
            
            # 2. Volunteer Enrollment Trends
            if chart_type in ['all', 'enrollment_trends']:
                # Get enrollment counts for each event
                events_data = []
                for event in host_events:
                    events_data.append({
                        'name': event.event_name,
                        'volunteers': event.volunteer_enrolled.count(),
                        'required': event.required_volunteers,
                        'status': event.status
                    })
                
                if events_data:
                    events_df = pd.DataFrame(events_data)
                    
                    # Sort by volunteer count
                    events_df = events_df.sort_values('volunteers', ascending=False)
                    
                    plt.figure(figsize=(12, 6))
                    bars = plt.bar(events_df['name'], events_df['volunteers'], color='skyblue')
                    
                    # Add required volunteer target line
                    for i, (_, row) in enumerate(events_df.iterrows()):
                        plt.plot([i-0.4, i+0.4], [row['required'], row['required']], 'r--')
                    
                    plt.xlabel("Events")
                    plt.ylabel("Number of Volunteers")
                    plt.title("Volunteer Enrollment by Event")
                    plt.xticks(rotation=45)
                    plt.grid(axis='y', linestyle='--', alpha=0.7)
                    plt.tight_layout()
                    
                    # Convert to SVG
                    svg_io = io.BytesIO()
                    plt.savefig(svg_io, format='svg')
                    plt.close()
                    
                    chart_svgs['enrollment_trends'] = svg_io.getvalue().decode('utf-8')
            
            # 3. Average Feedback Ratings Across All Events
            if chart_type in ['all', 'overall_feedback']:
                # Get all feedback for all host events
                all_feedback = Feedback.objects.filter(event__in=host_events)
                
                if all_feedback.exists():
                    metrics = ['overall_experience', 'organization_quality', 'communication', 
                               'host_interaction', 'volunteer_support', 'task_clarity',
                               'impact_awareness', 'inclusivity', 'time_management', 'recognition']
                    
                    avg_values = []
                    for metric in metrics:
                        avg = all_feedback.aggregate(avg=Avg(metric))['avg'] or 0
                        avg_values.append(avg)
                    
                    plt.figure(figsize=(10, 6))
                    plt.bar(metrics, avg_values, color='lightgreen')
                    plt.xlabel("Feedback Criteria")
                    plt.ylabel("Average Rating (0-10)")
                    plt.title(f"Average Feedback Ratings Across All Events")
                    plt.xticks(rotation=45)
                    plt.grid(axis='y', linestyle='--', alpha=0.7)
                    plt.tight_layout()
                    
                    # Convert to SVG
                    svg_io = io.BytesIO()
                    plt.savefig(svg_io, format='svg')
                    plt.close()
                    
                    chart_svgs['overall_feedback'] = svg_io.getvalue().decode('utf-8')
            
            # 4. Task Completion Rate by Event
            if chart_type in ['all', 'task_completion']:
                events_task_data = []
                
                for event in host_events:
                    total_tasks = TaskInfo.objects.filter(event=event).count()
                    completed_tasks = TaskInfo.objects.filter(event=event, status='Completed').count()
                    
                    if total_tasks > 0:
                        completion_rate = (completed_tasks / total_tasks) * 100
                    else:
                        completion_rate = 0
                    
                    events_task_data.append({
                        'name': event.event_name,
                        'completion_rate': completion_rate
                    })
                
                if events_task_data:
                    task_df = pd.DataFrame(events_task_data)
                    task_df = task_df.sort_values('completion_rate', ascending=False)
                    
                    plt.figure(figsize=(12, 6))
                    plt.bar(task_df['name'], task_df['completion_rate'], color='coral')
                    plt.xlabel("Events")
                    plt.ylabel("Task Completion Rate (%)")
                    plt.title("Task Completion Rate by Event")
                    plt.xticks(rotation=45)
                    plt.grid(axis='y', linestyle='--', alpha=0.7)
                    plt.tight_layout()
                    
                    # Convert to SVG
                    svg_io = io.BytesIO()
                    plt.savefig(svg_io, format='svg')
                    plt.close()
                    
                    chart_svgs['task_completion'] = svg_io.getvalue().decode('utf-8')
            
            # Return the SVGs
            return JsonResponse({
                'status': 'success',
                'host_name': request.user.name,
                'total_events': host_events.count(),
                'charts': chart_svgs
            })
            
        except Exception as e:
            print(f"Error in HostAnalyticsView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)

# Add these imports at the top of the file
import zipfile
from django.conf import settings
import os
from datetime import datetime

@method_decorator(csrf_exempt, name='dispatch')
class ExportChartsPNGView(View):
    """Export all charts for an event as PNG files in a zip archive"""
    
    def get(self, request):
        try:
            # Check if user is authenticated and is a host
            if not request.user.is_authenticated:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Authentication required'
                }, status=401)
            
            if not request.user.isHost:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Only hosts can export charts'
                }, status=403)
            
            # Get event_id from query parameters
            event_id = request.GET.get('event_id')
            if not event_id:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Event ID is required'
                }, status=400)
            
            # Get the event
            try:
                event = EventInfo.objects.get(id=event_id)
            except EventInfo.DoesNotExist:
                return JsonResponse({
                    'status': 'error',
                    'message': 'Event not found'
                }, status=404)
            
            # Verify user is the host of this event
            if event.host_id != request.user.id:
                return JsonResponse({
                    'status': 'error',
                    'message': 'You can only export charts for events you are hosting'
                }, status=403)

            # Create a temporary directory for PNG files
            temp_dir = os.path.join(settings.MEDIA_ROOT, 'temp_charts')
            os.makedirs(temp_dir, exist_ok=True)
            
            # Get feedback data
            feedbacks = Feedback.objects.filter(event=event)
            tasks = TaskInfo.objects.filter(event=event)
            
            # Create zip file
            zip_filename = f"event_{event_id}_charts_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
            zip_path = os.path.join(temp_dir, zip_filename)
            
            with zipfile.ZipFile(zip_path, 'w') as zip_file:
                # Generate each chart type and save as PNG
                if feedbacks.exists():
                    # Feedback ratings chart
                    metrics = ['overall_experience', 'organization_quality', 'communication', 
                             'host_interaction', 'volunteer_support', 'task_clarity',
                             'impact_awareness', 'inclusivity', 'time_management', 'recognition']
                    
                    avg_values = []
                    for metric in metrics:
                        avg = feedbacks.aggregate(avg=Avg(metric))['avg'] or 0
                        avg_values.append(avg)
                    
                    plt.figure(figsize=(12, 6))
                    plt.bar(metrics, avg_values, color='skyblue')
                    plt.xlabel("Feedback Criteria")
                    plt.ylabel("Average Rating (0-10)")
                    plt.title(f"Average Volunteer Ratings for {event.event_name}")
                    plt.xticks(rotation=45)
                    plt.grid(axis='y', linestyle='--', alpha=0.7)
                    plt.tight_layout()
                    
                    # Save to PNG
                    ratings_path = os.path.join(temp_dir, 'ratings.png')
                    plt.savefig(ratings_path, dpi=300, bbox_inches='tight')
                    plt.close()
                    zip_file.write(ratings_path, 'average_ratings.png')
                    
                    # Volunteer willingness pie chart
                    would_volunteer = feedbacks.filter(would_volunteer_again=True).count()
                    would_not_volunteer = feedbacks.filter(would_volunteer_again=False).count()
                    
                    plt.figure(figsize=(8, 8))
                    plt.pie([would_volunteer, would_not_volunteer], 
                           labels=['Would Volunteer Again', 'Would Not Volunteer'],
                           autopct='%1.1f%%',
                           colors=['lightgreen', 'lightcoral'])
                    plt.title(f"Volunteer Willingness - {event.event_name}")
                    plt.tight_layout()
                    
                    willingness_path = os.path.join(temp_dir, 'willingness.png')
                    plt.savefig(willingness_path, dpi=300, bbox_inches='tight')
                    plt.close()
                    zip_file.write(willingness_path, 'volunteer_willingness.png')
                
                if tasks.exists():
                    # Task status distribution
                    status_counts = tasks.values('status').annotate(count=Count('status'))
                    statuses = [item['status'] for item in status_counts]
                    counts = [item['count'] for item in status_counts]
                    
                    plt.figure(figsize=(8, 8))
                    plt.pie(counts, labels=statuses, autopct='%1.1f%%')
                    plt.title(f"Task Status Distribution - {event.event_name}")
                    plt.tight_layout()
                    
                    status_path = os.path.join(temp_dir, 'task_status.png')
                    plt.savefig(status_path, dpi=300, bbox_inches='tight')
                    plt.close()
                    zip_file.write(status_path, 'task_status.png')
                    
                    # Task completion timeline
                    completed_tasks = tasks.filter(status='Completed')
                    if completed_tasks.exists():
                        task_dates = [(task.task_name, task.updated_at) 
                                    for task in completed_tasks]
                        task_names, completion_dates = zip(*task_dates)
                        
                        plt.figure(figsize=(12, 6))
                        plt.plot_date(completion_dates, range(len(task_names)), '-o')
                        plt.yticks(range(len(task_names)), task_names)
                        plt.xlabel("Completion Date")
                        plt.title(f"Task Completion Timeline - {event.event_name}")
                        plt.grid(True)
                        plt.tight_layout()
                        
                        timeline_path = os.path.join(temp_dir, 'completion_timeline.png')
                        plt.savefig(timeline_path, dpi=300, bbox_inches='tight')
                        plt.close()
                        zip_file.write(timeline_path, 'completion_timeline.png')
            
            # Read the zip file
            with open(zip_path, 'rb') as zip_file:
                response = HttpResponse(zip_file.read(), content_type='application/zip')
                response['Content-Disposition'] = f'attachment; filename="{zip_filename}"'
            
            # Clean up temporary files
            for file in os.listdir(temp_dir):
                os.remove(os.path.join(temp_dir, file))
            os.rmdir(temp_dir)
            
            return response
            
        except Exception as e:
            print(f"Error in ExportChartsPNGView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)