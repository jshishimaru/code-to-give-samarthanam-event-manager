from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from ..models import Feedback, EventInfo
from ..serializers import FeedbackSerializer

class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'])
    def submit_feedback(self, request):
        serializer = FeedbackSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response({'message': 'Feedback submitted successfully'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def event_feedback(self, request, pk=None):
        try:
            event = EventInfo.objects.get(id=pk, host=request.user)
        except EventInfo.DoesNotExist:
            return Response({'error': 'Event not found or unauthorized'}, status=status.HTTP_404_NOT_FOUND)
        feedbacks = Feedback.objects.filter(event=event)
        serializer = FeedbackSerializer(feedbacks, many=True)
        return Response(serializer.data)