from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from ..models import Chat, TaskInfo
from ..serializers import ChatSerializer

class ChatViewSet(viewsets.ModelViewSet):
    queryset = Chat.objects.all()
    serializer_class = ChatSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'])
    def send_message(self, request):
        serializer = ChatSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(user=request.user)
            return Response({'message': 'Message sent successfully'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def task_chat(self, request, pk=None):
        try:
            task = TaskInfo.objects.get(id=pk)
        except TaskInfo.DoesNotExist:
            return Response({'error': 'Task not found'}, status=status.HTTP_404_NOT_FOUND)
        chats = Chat.objects.filter(task=task)
        serializer = ChatSerializer(chats, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def previous_replies(self, request, pk=None):
        try:
            chat = Chat.objects.get(id=pk)
        except Chat.DoesNotExist:
            return Response({'error': 'Chat not found'}, status=status.HTTP_404_NOT_FOUND)
        replies = Chat.objects.filter(task=chat.task, id__lt=chat.id).order_by('-id')
        serializer = ChatSerializer(replies, many=True)
        return Response(serializer.data)
