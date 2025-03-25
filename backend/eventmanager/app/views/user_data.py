import pandas as pd
import io
from django.http import HttpResponse
import datetime
from ..models import Feedback
from django.views import View
from django.http import JsonResponse
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.db import models
import traceback
from ..models import EventInfo, TaskInfo


@method_decorator(csrf_exempt, name='dispatch')
class ExportVolunteersToExcelView(View):
    """
    Export all volunteer data for an event to Excel
    Includes personal details, assignment information, and feedback
    """
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
                    'message': 'Only hosts can export volunteer data'
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
                    'message': 'You can only export data for events you are hosting'
                }, status=403)
            
            # Get all volunteers for the event
            volunteers = event.volunteer_enrolled.all()
            
            # Create a BytesIO buffer to store the Excel file
            excel_buffer = io.BytesIO()
            
            # Create an Excel writer
            with pd.ExcelWriter(excel_buffer, engine='xlsxwriter') as writer:
                
                # 1. Create the main volunteer information sheet
                volunteer_data = []
                for volunteer in volunteers:
                    # Get tasks assigned to this volunteer
                    assigned_tasks = TaskInfo.objects.filter(
                        event=event,
                        volunteers=volunteer
                    )
                    
                    # Get all tasks they've completed
                    completed_tasks = assigned_tasks.filter(status='Completed')
                    
                    # Get main feedback if provided
                    feedback = Feedback.objects.filter(
                        event=event,
                        user=volunteer
                    ).first()
                    
                    # Prepare volunteer data
                    volunteer_info = {
                        'Volunteer ID': volunteer.id,
                        'Name': volunteer.name,
                        'Email': volunteer.email,
                        'Contact': volunteer.contact,
                        'Skills': volunteer.skills,
                        'Organization': volunteer.organization,
                        'Location': volunteer.location,
                        'Assigned Tasks': assigned_tasks.count(),
                        'Completed Tasks': completed_tasks.count(),
                        'Completion Rate': f"{(completed_tasks.count() / assigned_tasks.count() * 100) if assigned_tasks.count() > 0 else 0:.1f}%",
                        'Feedback Submitted': 'Yes' if feedback else 'No',
                        'Overall Rating': f"{feedback.average_rating:.1f}" if feedback else '-',
                        'Would Volunteer Again': 'Yes' if feedback and feedback.would_volunteer_again else 'No' if feedback else '-',
                        'Signup Date': volunteer.date_joined.strftime('%Y-%m-%d')
                    }
                    volunteer_data.append(volunteer_info)
                
                # Create the DataFrame for volunteers and save to Excel
                if volunteer_data:
                    volunteers_df = pd.DataFrame(volunteer_data)
                    volunteers_df.to_excel(writer, sheet_name='Volunteers Overview', index=False)
                    
                    # Format the sheet
                    workbook = writer.book
                    worksheet = writer.sheets['Volunteers Overview']
                    header_format = workbook.add_format({'bold': True, 'bg_color': '#D9EAD3', 'border': 1})
                    
                    # Apply header formatting
                    for col_num, value in enumerate(volunteers_df.columns.values):
                        worksheet.write(0, col_num, value, header_format)
                        worksheet.set_column(col_num, col_num, max(len(value) + 2, 12))
                else:
                    # Create an empty sheet if no volunteers
                    pd.DataFrame().to_excel(writer, sheet_name='Volunteers Overview')
                    worksheet = writer.sheets['Volunteers Overview']
                    worksheet.write(0, 0, 'No volunteers enrolled in this event')
                
                # 2. Create a sheet for task assignments
                task_assignments = []
                for volunteer in volunteers:
                    # Get tasks assigned to this volunteer
                    assigned_tasks = TaskInfo.objects.filter(
                        event=event,
                        volunteers=volunteer
                    )
                    
                    for task in assigned_tasks:
                        # Get notification message if task is completed
                        completion_message = task.notification_message if task.completion_notified else ''
                        
                        assignment = {
                            'Volunteer Name': volunteer.name,
                            'Volunteer ID': volunteer.id,
                            'Task ID': task.id,
                            'Task Name': task.task_name,
                            'Status': task.status,
                            'Start Time': task.start_time.strftime('%Y-%m-%d %H:%M') if task.start_time else '',
                            'End Time': task.end_time.strftime('%Y-%m-%d %H:%M') if task.end_time else '',
                            'Required Skills': task.required_skills,
                            'Completion Notified': 'Yes' if task.completion_notified else 'No',
                            'Completion Message': completion_message
                        }
                        task_assignments.append(assignment)
                
                # Create the DataFrame for task assignments
                if task_assignments:
                    assignments_df = pd.DataFrame(task_assignments)
                    assignments_df.to_excel(writer, sheet_name='Task Assignments', index=False)
                    
                    # Format the sheet
                    worksheet = writer.sheets['Task Assignments']
                    header_format = workbook.add_format({'bold': True, 'bg_color': '#D9EAD3', 'border': 1})
                    
                    # Apply header formatting
                    for col_num, value in enumerate(assignments_df.columns.values):
                        worksheet.write(0, col_num, value, header_format)
                        worksheet.set_column(col_num, col_num, max(len(value) + 2, 12))
                else:
                    # Create an empty sheet if no task assignments
                    pd.DataFrame().to_excel(writer, sheet_name='Task Assignments')
                    worksheet = writer.sheets['Task Assignments']
                    worksheet.write(0, 0, 'No task assignments for this event')
                
                # 3. Create a sheet for volunteer feedback
                feedbacks = Feedback.objects.filter(event=event)
                
                feedback_data = []
                for feedback in feedbacks:
                    feedback_info = {
                        'Volunteer Name': feedback.user.name,
                        'Volunteer ID': feedback.user.id,
                        'Overall Experience': feedback.overall_experience if feedback.overall_experience is not None else '-',
                        'Organization Quality': feedback.organization_quality if feedback.organization_quality is not None else '-',
                        'Communication': feedback.communication if feedback.communication is not None else '-',
                        'Host Interaction': feedback.host_interaction if feedback.host_interaction is not None else '-',
                        'Volunteer Support': feedback.volunteer_support if feedback.volunteer_support is not None else '-',
                        'Task Clarity': feedback.task_clarity if feedback.task_clarity is not None else '-',
                        'Impact Awareness': feedback.impact_awareness if feedback.impact_awareness is not None else '-',
                        'Inclusivity': feedback.inclusivity if feedback.inclusivity is not None else '-',
                        'Time Management': feedback.time_management if feedback.time_management is not None else '-',
                        'Recognition': feedback.recognition if feedback.recognition is not None else '-',
                        'Strengths': feedback.strengths,
                        'Improvements': feedback.improvements,
                        'Additional Comments': feedback.additional_comments,
                        'Would Volunteer Again': 'Yes' if feedback.would_volunteer_again else 'No',
                        'Average Rating': f"{feedback.average_rating:.1f}",
                        'Submitted At': feedback.created_at.strftime('%Y-%m-%d %H:%M')
                    }
                    feedback_data.append(feedback_info)
                
                # Create the DataFrame for feedback
                if feedback_data:
                    feedback_df = pd.DataFrame(feedback_data)
                    feedback_df.to_excel(writer, sheet_name='Volunteer Feedback', index=False)
                    
                    # Format the sheet
                    worksheet = writer.sheets['Volunteer Feedback']
                    header_format = workbook.add_format({'bold': True, 'bg_color': '#D9EAD3', 'border': 1})
                    
                    # Apply header formatting and set column widths
                    for col_num, value in enumerate(feedback_df.columns.values):
                        worksheet.write(0, col_num, value, header_format)
                        
                        # Make text columns wider
                        if value in ['Strengths', 'Improvements', 'Additional Comments']:
                            worksheet.set_column(col_num, col_num, 40)
                        else:
                            worksheet.set_column(col_num, col_num, max(len(value) + 2, 12))
                else:
                    # Create an empty sheet if no feedback
                    pd.DataFrame().to_excel(writer, sheet_name='Volunteer Feedback')
                    worksheet = writer.sheets['Volunteer Feedback']
                    worksheet.write(0, 0, 'No feedback submitted for this event')
                
                # 4. Create a sheet with event summary
                # Count tasks by status
                task_status_counts = {}
                for status_choice in TaskInfo.STATUS_CHOICES:
                    status = status_choice[0]
                    count = TaskInfo.objects.filter(event=event, status=status).count()
                    task_status_counts[status] = count
                
                # Calculate average rating across all feedback
                avg_rating = 0
                if feedbacks.exists():
                    avg_rating = sum(feedback.average_rating for feedback in feedbacks) / feedbacks.count()
                
                # Create a summary sheet
                summary_data = {
                    'Metric': [
                        'Event Name',
                        'Event Status',
                        'Event Start Date',
                        'Event End Date',
                        'Total Volunteers',
                        'Total Tasks',
                        'Completed Tasks',
                        'In Progress Tasks',
                        'Pending Tasks',
                        'Feedback Submission Rate',
                        'Avg. Volunteer Rating',
                        'Would Volunteer Again Rate',
                        'Report Generated'
                    ],
                    'Value': [
                        event.event_name,
                        event.status,
                        event.start_time.strftime('%Y-%m-%d') if event.start_time else 'Not set',
                        event.end_time.strftime('%Y-%m-%d') if event.end_time else 'Not set',
                        volunteers.count(),
                        TaskInfo.objects.filter(event=event).count(),
                        task_status_counts.get('Completed', 0),
                        task_status_counts.get('In Progress', 0),
                        task_status_counts.get('Pending', 0),
                        f"{(feedbacks.count() / volunteers.count() * 100) if volunteers.count() > 0 else 0:.1f}%",
                        f"{avg_rating:.1f}/10.0",
                        f"{(feedbacks.filter(would_volunteer_again=True).count() / feedbacks.count() * 100) if feedbacks.count() > 0 else 0:.1f}%",
                        datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                    ]
                }
                
                # Create the DataFrame for summary
                summary_df = pd.DataFrame(summary_data)
                summary_df.to_excel(writer, sheet_name='Event Summary', index=False)
                
                # Format the summary sheet
                worksheet = writer.sheets['Event Summary']
                header_format = workbook.add_format({'bold': True, 'bg_color': '#D9EAD3', 'border': 1})
                metric_format = workbook.add_format({'bold': True})
                
                # Apply formatting
                for col_num, value in enumerate(summary_df.columns.values):
                    worksheet.write(0, col_num, value, header_format)
                    worksheet.set_column(col_num, col_num, 25)
                
                # Make metric column bold
                for row_num in range(len(summary_df)):
                    worksheet.write(row_num + 1, 0, summary_df.iloc[row_num, 0], metric_format)
            
            # Seek to the beginning of the buffer
            excel_buffer.seek(0)
            
            # Create the HttpResponse with appropriate headers
            response = HttpResponse(
                excel_buffer.getvalue(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            
            # Set the filename with event name and date
            safe_event_name = event.event_name.replace(' ', '_').replace('/', '-')
            filename = f"{safe_event_name}_Volunteers_{datetime.date.today().strftime('%Y-%m-%d')}.xlsx"
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            
            return response
            
        except Exception as e:
            print(f"Error in ExportVolunteersToExcelView: {str(e)}")
            print(traceback.format_exc())
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=500)
    
    def post(self, request):
        # POST method can use the same logic as GET
        return self.get(request)