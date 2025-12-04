"""
Messaging Views

API endpoints for user-to-user messaging.
"""

from rest_framework import viewsets, generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.views import APIView
from django.db.models import Q, Max, Count
from django.db.models.functions import Coalesce
from django.utils import timezone
from datetime import datetime as dt

from .models import Message, TypingIndicator, CourseGroup, GroupMessage, GroupMember
from .serializers import (
    MessageSerializer, 
    ConversationSerializer, 
    TypingIndicatorSerializer,
    GroupSerializer,
    GroupMessageSerializer,
    CourseGroupSerializer,
    GroupMemberSerializer
)
from .utils import sync_course_group_members
from courses.models import Course
from enrollments.models import Enrollment
from .permissions import IsMessageParticipant
from users.models import User
from courses.models import Course
from enrollments.models import Enrollment


class SendMessageAPIView(generics.CreateAPIView):
    """
    POST /api/messages/send/
    
    Send a message to another user.
    Body: receiver_id, course_id (optional), content
    """
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        """Create message with validation."""
        receiver_id = self.request.data.get('receiver_id')
        course_id = self.request.data.get('course_id_write') or self.request.data.get('course_id')
        
        if not receiver_id:
            raise ValidationError({"receiver_id": "This field is required."})
        
        # Get receiver
        try:
            receiver = User.objects.get(id=receiver_id)
        except User.DoesNotExist:
            raise ValidationError({"receiver_id": "Receiver user not found."})
        
        # Validate permissions
        sender = self.request.user
        
        # If student, can only message teachers of enrolled courses
        # OR teachers they've already messaged (to allow continuing conversations)
        if sender.role == 'student':
            # Check if they've already had a conversation (more lenient)
            has_existing_conversation = Message.objects.filter(
                (Q(sender=sender) & Q(receiver=receiver)) |
                (Q(sender=receiver) & Q(receiver=sender))
            ).exists()
            
            if course_id:
                # Check if student is enrolled in the course
                try:
                    course = Course.objects.get(id=course_id)
                    enrollment = Enrollment.objects.filter(
                        student=sender,
                        course=course
                    ).exists()
                    if not enrollment:
                        # Allow if they have existing conversation
                        if not has_existing_conversation:
                            raise PermissionDenied("You can only message teachers of courses you are enrolled in.")
                    
                    # Check if receiver is the teacher of this course
                    if receiver != course.teacher:
                        # Allow if they have existing conversation
                        if not has_existing_conversation:
                            raise PermissionDenied("You can only message the teacher of this course.")
                except Course.DoesNotExist:
                    raise ValidationError({"course_id": "Course not found."})
            else:
                # Student can message teachers of enrolled courses OR teachers they've already messaged
                enrolled_courses = list(Enrollment.objects.filter(student=sender).values_list('course__teacher_id', flat=True).distinct())
                if receiver.id not in enrolled_courses and not has_existing_conversation:
                    # Provide more helpful error message
                    error_msg = f"You can only message teachers of courses you are enrolled in. Receiver ID: {receiver.id}, Enrolled teacher IDs: {enrolled_courses}, Has existing conversation: {has_existing_conversation}"
                    raise PermissionDenied(error_msg)
        
        # Teacher can message any enrolled student
        elif sender.role == 'teacher':
            if course_id:
                # Check if receiver is enrolled in the course
                try:
                    course = Course.objects.get(id=course_id)
                    if course.teacher != sender:
                        raise PermissionDenied("You can only message students enrolled in your courses.")
                    
                    enrollment = Enrollment.objects.filter(
                        student=receiver,
                        course=course
                    ).exists()
                    if not enrollment and receiver.role != 'teacher':
                        raise PermissionDenied("Student must be enrolled in the course.")
                except Course.DoesNotExist:
                    raise ValidationError({"course_id": "Course not found."})
        
        # Serializer will handle the creation with course_id_write
        serializer.save()


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_conversation(request):
    """
    GET /api/messages/conversation/?user1=&user2=&page=
    
    Get conversation between two users, sorted by time.
    Supports pagination.
    """
    from rest_framework.pagination import PageNumberPagination
    
    user1_id = request.query_params.get('user1')
    user2_id = request.query_params.get('user2')
    
    if not user1_id or not user2_id:
        return Response(
            {"detail": "Both user1 and user2 parameters are required."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user1 = User.objects.get(id=user1_id)
        user2 = User.objects.get(id=user2_id)
    except User.DoesNotExist:
        return Response(
            {"detail": "One or both users not found."},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Ensure request user is one of the participants
    if request.user not in [user1, user2]:
        raise PermissionDenied("You can only view conversations you are part of.")
    
    # Get messages between the two users with optimized queries
    messages = Message.objects.filter(
        (Q(sender=user1) & Q(receiver=user2)) |
        (Q(sender=user2) & Q(receiver=user1))
    ).select_related('sender', 'receiver', 'course').order_by('-sent_at')
    
    # Pagination
    paginator = PageNumberPagination()
    paginator.page_size = 50  # 50 messages per page
    paginated_messages = paginator.paginate_queryset(messages, request)
    
    serializer = ConversationSerializer(paginated_messages, many=True, context={'request': request})
    
    # Reverse order for display (oldest first)
    response_data = list(serializer.data)
    response_data.reverse()
    
    return paginator.get_paginated_response(response_data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_unread_messages(request):
    """
    GET /api/messages/unread/?user_id=
    
    Get unread messages for a user.
    """
    user_id = request.query_params.get('user_id')
    
    if not user_id:
        return Response(
            {"detail": "user_id parameter is required."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {"detail": "User not found."},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Ensure request user is the user or has permission
    if request.user != user:
        raise PermissionDenied("You can only view your own unread messages.")
    
    # Get unread messages with optimized query
    unread_messages = Message.objects.filter(
        receiver=user,
        is_read=False
    ).select_related('sender', 'receiver', 'course').order_by('-sent_at')
    
    serializer = ConversationSerializer(unread_messages, many=True, context={'request': request})
    return Response({
        "count": unread_messages.count(),
        "messages": serializer.data
    })


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated])
def mark_message_read(request, message_id):
    """
    PATCH /api/messages/mark-read/{id}/
    
    Mark a message as read.
    """
    try:
        message = Message.objects.select_related('sender', 'receiver', 'course').get(id=message_id)
    except Message.DoesNotExist:
        return Response(
            {"detail": "Message not found."},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Only receiver can mark as read
    if message.receiver != request.user:
        raise PermissionDenied("You can only mark messages you received as read.")
    
    message.is_read = True
    message.save()
    
    serializer = ConversationSerializer(message, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_conversations_list(request):
    """
    GET /api/messages/conversations/
    
    Get list of conversations for the current user.
    Returns list with:
    - conversation_user: id, full_name, avatar_url, role
    - last_message
    - last_message_time
    - unread_count_for_current_user
    - is_online (placeholder)
    """
    from .serializers import ConversationListSerializer
    
    try:
        user = request.user
        
        # Get all unique conversation partners with optimized query
        # Get distinct partners from both sent and received messages
        sent_partners = Message.objects.filter(sender=user).values_list('receiver_id', flat=True).distinct()
        received_partners = Message.objects.filter(receiver=user).values_list('sender_id', flat=True).distinct()
        partner_ids = set(list(sent_partners) + list(received_partners))
        
        if not partner_ids:
            return Response([])
        
        # Get all partners with select_related optimization
        partners = User.objects.filter(id__in=partner_ids)
        
        # Get last messages for each conversation with optimized query
        conversations_data = []
        for partner in partners:
            try:
                # Get last message with select_related
                last_message = Message.objects.filter(
                    (Q(sender=user) & Q(receiver=partner)) |
                    (Q(sender=partner) & Q(receiver=user))
                ).select_related('sender', 'receiver', 'course').order_by('-sent_at').first()
                
                # Get unread count
                unread_count = Message.objects.filter(
                    sender=partner,
                    receiver=user,
                    is_read=False
                ).count()
                
                # Get last message data safely
                last_message_data = None
                last_message_time = None
                if last_message:
                    try:
                        last_message_data = ConversationSerializer(last_message, context={'request': request}).data
                        last_message_time = last_message.sent_at
                    except Exception as e:
                        # If serialization fails, log and set to None
                        import traceback
                        print(f"Error serializing last message: {e}")
                        print(traceback.format_exc())
                        last_message_data = None
                        last_message_time = None
                
                conversations_data.append({
                    'conversation_user': {
                        'id': partner.id,
                        'full_name': partner.full_name or '',
                        'avatar_url': partner.avatar_url or None,
                        'role': partner.role or '',
                    },
                    'last_message': last_message_data,
                    'last_message_time': last_message_time,
                    'unread_count_for_current_user': unread_count,
                    'is_online': False,  # Placeholder - can be implemented with WebSocket or Redis
                })
            except Exception as e:
                # Skip this partner if there's an error
                import traceback
                print(f"Error processing partner {partner.id}: {e}")
                print(traceback.format_exc())
                continue
        
        # Sort by last message time (most recent first)
        # Handle None values safely
        def get_sort_key(x):
            if x.get('last_message_time'):
                return x['last_message_time']
            return timezone.make_aware(dt.min)
        
        conversations_data.sort(key=get_sort_key, reverse=True)
        
        # Serialize the data
        try:
            serializer = ConversationListSerializer(conversations_data, many=True)
            # For Serializer (not ModelSerializer), we need to check is_valid
            # But since we're constructing the data ourselves, it should be valid
            if serializer.is_valid():
                return Response(serializer.validated_data)
            else:
                # Log validation errors for debugging
                print(f"Serializer validation errors: {serializer.errors}")
                # Return raw data as fallback if validation fails
                return Response(conversations_data)
        except Exception as serialization_error:
            import traceback
            print(f"Error serializing conversations list: {serialization_error}")
            print(traceback.format_exc())
            # Return raw data as fallback
            return Response(conversations_data)
    except Exception as e:
        import traceback
        print(f"Error in get_conversations_list: {e}")
        print(traceback.format_exc())
        return Response(
            {"detail": "An error occurred while loading conversations."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_available_contacts(request):
    """
    GET /api/messages/contacts/
    
    Get list of users the current user can message.
    - Students: teachers of enrolled courses
    - Teachers: students enrolled in their courses
    """
    user = request.user
    
    if user.role == 'student':
        # Get teachers of enrolled courses
        enrolled_courses = Enrollment.objects.filter(student=user).select_related('course__teacher')
        teacher_ids = set(enrollment.course.teacher_id for enrollment in enrolled_courses)
        contacts = User.objects.filter(id__in=teacher_ids, role='teacher')
    
    elif user.role == 'teacher':
        # Get students enrolled in teacher's courses
        teacher_courses = Course.objects.filter(teacher=user)
        enrollments = Enrollment.objects.filter(course__in=teacher_courses).select_related('student')
        student_ids = set(enrollment.student_id for enrollment in enrollments)
        contacts = User.objects.filter(id__in=student_ids, role='student')
    
    else:
        # Admin can message anyone
        contacts = User.objects.exclude(id=user.id)
    
    from users.serializers import UserSerializer
    serializer = UserSerializer(contacts, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def typing_indicator(request):
    """
    POST /api/messages/typing/
    
    Update typing indicator.
    Body: receiver_id, is_typing
    """
    receiver_id = request.data.get('receiver_id')
    is_typing = request.data.get('is_typing', False)
    
    if not receiver_id:
        return Response(
            {"detail": "receiver_id is required."},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        receiver = User.objects.get(id=receiver_id)
    except User.DoesNotExist:
        return Response(
            {"detail": "Receiver user not found."},
            status=status.HTTP_404_NOT_FOUND
        )
    
    sender = request.user
    
    # Validate permissions - same rules as messaging
    # Allow typing if they can message (enrolled OR have existing conversation)
    if sender.role == 'student':
        # Check if they've already had a conversation (more lenient)
        has_existing_conversation = Message.objects.filter(
            (Q(sender=sender) & Q(receiver=receiver)) |
            (Q(sender=receiver) & Q(receiver=sender))
        ).exists()
        
        # Student can type to teachers of enrolled courses OR teachers they've already messaged
        enrolled_courses = list(Enrollment.objects.filter(student=sender).values_list('course__teacher_id', flat=True).distinct())
        if receiver.id not in enrolled_courses and not has_existing_conversation:
            # Provide more helpful error message
            error_msg = f"You can only type to teachers of courses you are enrolled in. Receiver ID: {receiver.id}, Enrolled teacher IDs: {enrolled_courses}, Has existing conversation: {has_existing_conversation}"
            raise PermissionDenied(error_msg)
    
    elif sender.role == 'teacher':
        # Teacher can type to students enrolled in their courses
        teacher_courses = Course.objects.filter(teacher=sender)
        enrollments = Enrollment.objects.filter(course__in=teacher_courses).values_list('student_id', flat=True)
        if receiver.role == 'student' and receiver.id not in enrollments:
            raise PermissionDenied("You can only type to students enrolled in your courses.")
    
    # Get or create typing indicator
    typing_indicator, created = TypingIndicator.objects.get_or_create(
        sender=sender,
        receiver=receiver,
        defaults={'is_typing': is_typing}
    )
    
    if not created:
        typing_indicator.is_typing = is_typing
        typing_indicator.save()
    
    serializer = TypingIndicatorSerializer(typing_indicator, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_typing_indicator(request):
    """
    GET /api/messages/typing/status/?receiver_id=
    
    Get typing indicator for a conversation.
    """
    try:
        receiver_id = request.query_params.get('receiver_id')
        
        if not receiver_id:
            return Response(
                {"detail": "receiver_id parameter is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            receiver = User.objects.get(id=receiver_id)
        except User.DoesNotExist:
            return Response(
                {"detail": "Receiver user not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        sender = request.user
        
        try:
            typing_indicator = TypingIndicator.objects.get(sender=receiver, receiver=sender)
            serializer = TypingIndicatorSerializer(typing_indicator, context={'request': request})
            return Response(serializer.data)
        except TypingIndicator.DoesNotExist:
            return Response({
                'is_typing': False,
                'sender': None,
                'receiver': None,
                'updated_at': None,
            })
    except Exception as e:
        import traceback
        print(f"Error in get_typing_indicator: {e}")
        print(traceback.format_exc())
        return Response(
            {"detail": "An error occurred while checking typing status."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ============================================
# GROUP CHAT VIEWS
# ============================================

def validate_group_access(group, user):
    """Validate that user is a member of the group."""
    if not GroupMember.objects.filter(group=group, user=user).exists():
        raise PermissionDenied("You are not a member of this group.")

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_my_groups(request):
    """
    GET /api/messages/groups/my/
    
    Get all groups where request.user is a member.
    Before returning, sync all courses where user is teacher or student.
    Returns: id, name, course_id, member_count, members list, last_message preview
    """
    try:
        user = request.user
        
        # Sync all courses where user is teacher or student
        courses = Course.objects.filter(teacher=user) | Course.objects.filter(enrollments__student=user)
        courses = courses.distinct()
        
        for course in courses:
            sync_course_group_members(course)
        
        # Get all groups where user is a member (after sync)
        member_groups = GroupMember.objects.filter(user=user).select_related('group', 'group__course')
        groups_data = []
        
        # Get all group IDs
        group_ids = [member.group.id for member in member_groups]
        
        # Get last message for each group
        from django.db.models import Max
        last_messages_map = {}
        max_date_map = {}
        
        if group_ids:
            # Get max created_at for each group for sorting
            max_dates = GroupMessage.objects.filter(
                group_id__in=group_ids
            ).values('group').annotate(max_date=Max('created_at'))
            
            max_date_map = {item['group']: item['max_date'] for item in max_dates}
            
            # Get the latest message for each group (using subquery for efficiency)
            for group_id in group_ids:
                last_message = GroupMessage.objects.filter(
                    group_id=group_id
                ).select_related('sender').order_by('-created_at').first()
                if last_message:
                    last_messages_map[group_id] = last_message
        
        for member in member_groups:
            group = member.group
            last_message = last_messages_map.get(group.id)
            
            last_message_preview = None
            if last_message:
                # Format last message preview
                sender_name = last_message.sender.full_name or last_message.sender.email
                preview_text = last_message.content[:50] + ('...' if len(last_message.content) > 50 else '')
                last_message_preview = f"{sender_name}: {preview_text}"
            
            # Get all members of this group with their details
            group_members = GroupMember.objects.filter(
                group=group
            ).select_related('user').order_by('role', 'user__full_name', 'user__email')
            
            members_list = []
            for gm in group_members:
                members_list.append({
                    'id': gm.user.id,
                    'full_name': gm.user.full_name or '',
                    'avatar_url': gm.user.avatar_url or None,
                    'role': gm.role,
                })
            
            groups_data.append({
                'id': group.id,
                'name': group.name,
                'course_id': group.course.id,
                'member_count': group.members.count(),
                'members': members_list,
                'last_message_preview': last_message_preview,
                'course_thumbnail': group.course.thumbnail_url if group.course.thumbnail_url else None,
                'last_message_time': max_date_map.get(group.id),  # For sorting
            })
        
        # Sort by last message time (most recent first)
        groups_data.sort(
            key=lambda x: x['last_message_time'] if x['last_message_time'] else timezone.make_aware(dt.min),
            reverse=True
        )
        
        # Remove last_message_time from response (it was only for sorting)
        for group_data in groups_data:
            group_data.pop('last_message_time', None)
        
        return Response(groups_data)
    except Exception as e:
        import traceback
        print(f"Error in get_my_groups: {e}")
        print(traceback.format_exc())
        return Response(
            {"detail": "An error occurred while loading groups."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_group_messages(request, group_id):
    """
    GET /api/messages/groups/<group_id>/messages/?page=
    
    Get paginated messages for a group (50/page, newest first).
    Only members can view messages.
    """
    from rest_framework.pagination import PageNumberPagination
    
    try:
        # Get group
        try:
            group = CourseGroup.objects.get(id=group_id)
        except CourseGroup.DoesNotExist:
            return Response(
                {"detail": "Group not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Validate group access
        validate_group_access(group, request.user)
        
        # Get messages (newest first)
        messages = GroupMessage.objects.filter(
            group=group
        ).select_related('sender', 'group').order_by('-created_at')
        
        # Pagination
        paginator = PageNumberPagination()
        paginator.page_size = 50
        paginated_messages = paginator.paginate_queryset(messages, request)
        
        serializer = GroupMessageSerializer(paginated_messages, many=True, context={'request': request})
        
        # Reverse order for display (oldest first)
        response_data = list(serializer.data)
        response_data.reverse()
        
        return paginator.get_paginated_response(response_data)
    except PermissionDenied:
        raise
    except Exception as e:
        import traceback
        print(f"Error in get_group_messages: {e}")
        print(traceback.format_exc())
        return Response(
            {"detail": "An error occurred while loading messages."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def send_group_message(request, group_id):
    """
    POST /api/messages/groups/<group_id>/messages/send/
    
    Body: { "content": "text..." }
    
    Create a GroupMessage.
    Only members can send messages.
    """
    try:
        # Get group
        try:
            group = CourseGroup.objects.get(id=group_id)
        except CourseGroup.DoesNotExist:
            return Response(
                {"detail": "Group not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Validate group access
        validate_group_access(group, request.user)
        
        # Validate content
        content = request.data.get('content', '').strip()
        if not content:
            return Response(
                {"detail": "Message content is required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create message
        message = GroupMessage.objects.create(
            group=group,
            sender=request.user,
            content=content
        )
        
        serializer = GroupMessageSerializer(message, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except PermissionDenied:
        raise
    except Exception as e:
        import traceback
        print(f"Error in send_group_message: {e}")
        print(traceback.format_exc())
        return Response(
            {"detail": "An error occurred while sending message."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


class UserCourseGroups(APIView):
    """
    GET /api/messages/groups/
    
    Get all groups where the current user is a member.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Return all groups where user is a member."""
        user = request.user
        
        # Sync all courses where user is teacher or student before returning
        courses = Course.objects.filter(teacher=user) | Course.objects.filter(enrollments__student=user)
        courses = courses.distinct()
        
        for course in courses:
            sync_course_group_members(course)
        
        # Get all groups where user is a member
        groups = CourseGroup.objects.filter(members__user=user).distinct()
        serializer = CourseGroupSerializer(groups, many=True)
        return Response(serializer.data)


class GroupMembersAPIView(APIView):
    """
    GET /api/messages/groups/<group_id>/members/
    
    Get all members of a group.
    Only group members can view the member list.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request, group_id):
        """Return list of all group members."""
        # Check membership before showing list
        if not GroupMember.objects.filter(group_id=group_id, user=request.user).exists():
            return Response(
                {"detail": "Not in this group"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get all members with user details
        members = GroupMember.objects.filter(group_id=group_id).select_related("user").order_by('-is_admin', 'user__full_name', 'user__email')
        serializer = GroupMemberSerializer(members, many=True)
        return Response(serializer.data)
